"""Tests for the snapshot validator that gates every GitHub Pages deployment."""
import copy
import json
import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

SCRIPT = Path(__file__).resolve().parents[1] / "validate_public_data.py"
NOW = "2026-10-31T10:00:00+00:00"

GOOD = {
    "status.json": {
        "retrieved_at": NOW,
        "global_macro": {"status": "available", "observation_count": 1},
        "market_quotes": {"status": "not_connected"},
        "global_news": {"official_primary_source_count": 1},
    },
    "macro-india-gdp.json": {"retrieved_at": NOW, "observations": [{"date": "2023", "value": 3.5e12}]},
    "macro-global.json": {"retrieved_at": NOW, "observations": [
        {"country_code": "IND", "indicator_code": "NY.GDP.MKTP.KD.ZG", "date": "2023", "value": 7.6}]},
    "news-global.json": {
        "retrieved_at": NOW, "official_primary_source_count": 1, "discovery_index_count": 0,
        "articles": [{"title": "RBI release", "url": "https://www.rbi.org.in/pr/1", "source_type": "official_primary_source"}],
    },
}


def run_validator(files):
    with tempfile.TemporaryDirectory() as tmp:
        for name, payload in files.items():
            text = payload if isinstance(payload, str) else json.dumps(payload)
            (Path(tmp) / name).write_text(text, encoding="utf-8")
        env = {**os.environ, "FINPILOT_DATA_DIR": tmp}
        return subprocess.run([sys.executable, "-I", str(SCRIPT)], env=env, capture_output=True, text=True)


def variant(mutator):
    data = copy.deepcopy(GOOD)
    mutator(data)
    return data


class ValidatorTests(unittest.TestCase):
    def assertRejected(self, files, fragment):
        result = run_validator(files)
        self.assertNotEqual(result.returncode, 0, result.stdout)
        self.assertIn(fragment, result.stderr + result.stdout)

    def test_valid_snapshots_pass(self):
        result = run_validator(GOOD)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("integrity checks passed", result.stdout)

    def test_missing_file_fails(self):
        files = {k: v for k, v in GOOD.items() if k != "news-global.json"}
        self.assertRejected(files, "Missing required snapshot")

    def test_invalid_json_fails(self):
        self.assertRejected({**GOOD, "status.json": "{oops"}, "Invalid JSON")

    def test_timestamp_without_timezone_fails(self):
        self.assertRejected(variant(lambda d: d["news-global.json"].update(retrieved_at="2026-10-31T10:00:00")), "invalid retrieved_at")

    def test_non_https_news_link_fails(self):
        def m(d): d["news-global.json"]["articles"][0]["url"] = "http://www.rbi.org.in/pr/1"
        self.assertRejected(variant(m), "HTTPS")

    def test_unsafe_scheme_fails(self):
        def m(d): d["news-global.json"]["articles"][0]["url"] = "javascript:alert(1)"
        self.assertRejected(variant(m), "HTTPS")

    def test_non_official_domain_marked_official_fails(self):
        def m(d): d["news-global.json"]["articles"][0]["url"] = "https://rbi.org.in.evil.example/x"
        self.assertRejected(variant(m), "Unexpected domain marked as official")

    def test_official_count_mismatch_fails(self):
        self.assertRejected(variant(lambda d: d["news-global.json"].update(official_primary_source_count=5)), "Official-source count")

    def test_market_quotes_must_stay_disconnected(self):
        self.assertRejected(variant(lambda d: d["status.json"]["market_quotes"].update(status="live")), "Market quotes must remain")

    def test_nan_macro_value_fails(self):
        self.assertRejected({**GOOD, "macro-india-gdp.json": '{"retrieved_at": "%s", "observations": [{"date": "2023", "value": NaN}]}' % NOW}, "invalid numeric value")

    def test_global_macro_count_mismatch_fails(self):
        self.assertRejected(variant(lambda d: d["status.json"]["global_macro"].update(observation_count=9)), "observation count")


if __name__ == "__main__":
    unittest.main()
