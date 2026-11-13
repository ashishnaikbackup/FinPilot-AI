import json, tempfile, unittest
from pathlib import Path
from unittest.mock import patch
from automation.merge_market_quotes import main

class MergeTests(unittest.TestCase):
    def test_merge_only_permitted_available_snapshots(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp)
            india={"status":"available","provider":"IndiaFeed","as_of":"2026-11-12","instruments":[{"symbol":"ABC","market":"NSE","bars":[]}]}
            global_data={"status":"unavailable","provider":"GlobalFeed","instruments":[{"symbol":"XYZ","market":"US","bars":[]}]}
            with patch("automation.merge_market_quotes.DATA",root):
                (root/"market-quotes-india.json").write_text(json.dumps(india))
                (root/"market-quotes-global.json").write_text(json.dumps(global_data))
                main()
                result=json.loads((root/"market-quotes.json").read_text())
            self.assertEqual(result["status"],"available")
            self.assertEqual(len(result["instruments"]),1)
            self.assertEqual(result["provider"],"IndiaFeed")
    def test_no_sources_is_unavailable(self):
        with tempfile.TemporaryDirectory() as tmp:
            with patch("automation.merge_market_quotes.DATA",Path(tmp)):
                main()
                result=json.loads((Path(tmp)/"market-quotes.json").read_text())
            self.assertEqual(result["status"],"unavailable")
            self.assertEqual(result["instruments"],[])

if __name__=="__main__": unittest.main()
