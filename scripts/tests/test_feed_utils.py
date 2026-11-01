import unittest

from feed_utils import parse_feed


class FeedParserTests(unittest.TestCase):
    def test_rss_accepts_whitelisted_https_sources_and_rejects_other_links(self):
        xml = b"""<?xml version="1.0"?>
        <rss version="2.0"><channel>
          <item><title>RBI policy update</title><link>https://www.rbi.org.in/release/1</link><pubDate>Sat, 31 Oct 2026 10:00:00 GMT</pubDate></item>
          <item><title>Untrusted copy</title><link>https://fake-rbi.example/release/2</link></item>
          <item><title>Insecure link</title><link>http://www.rbi.org.in/release/3</link></item>
        </channel></rss>"""
        items = parse_feed(xml, "RBI", ["rbi.org.in"], "India", "2026-10-31T10:05:00+00:00")
        self.assertEqual(len(items), 1)
        self.assertEqual(items[0]["title"], "RBI policy update")
        self.assertEqual(items[0]["source_type"], "official_primary_source")
        self.assertEqual(items[0]["source_country"], "India")
        self.assertEqual(items[0]["domain"], "www.rbi.org.in")

    def test_atom_namespace_and_link_attribute_are_supported(self):
        xml = b"""<?xml version="1.0"?>
        <feed xmlns="http://www.w3.org/2005/Atom">
          <entry>
            <title>Fed policy release</title>
            <link href="https://www.federalreserve.gov/newsevents/test.htm" />
            <updated>2026-10-31T09:00:00Z</updated>
          </entry>
        </feed>"""
        items = parse_feed(xml, "Federal Reserve", ["federalreserve.gov"], "United States", "2026-10-31T10:05:00+00:00")
        self.assertEqual(len(items), 1)
        self.assertEqual(items[0]["published_at"], "2026-10-31T09:00:00Z")
        self.assertEqual(items[0]["source_country"], "United States")

    def test_item_limit_is_respected(self):
        xml = b"""<rss><channel>
          <item><title>One</title><link>https://www.sebi.gov.in/1</link></item>
          <item><title>Two</title><link>https://www.sebi.gov.in/2</link></item>
        </channel></rss>"""
        items = parse_feed(xml, "SEBI", ["sebi.gov.in"], "India", "2026-10-31T10:05:00+00:00", limit=1)
        self.assertEqual(len(items), 1)

    def test_doctype_and_entity_declarations_are_rejected(self):
        xml = b"""<?xml version="1.0"?>
        <!DOCTYPE rss [<!ENTITY a "aaaaaaaaaa"><!ENTITY b "&a;&a;&a;&a;&a;&a;&a;&a;">]>
        <rss><channel><item><title>&b;</title><link>https://www.rbi.org.in/1</link></item></channel></rss>"""
        with self.assertRaises(ValueError):
            parse_feed(xml, "RBI", ["rbi.org.in"], "India", "2026-10-31T10:05:00+00:00")

    def test_doctype_is_rejected_in_utf16_feeds_too(self):
        xml = '<?xml version="1.0" encoding="utf-16"?><!DOCTYPE rss [<!ENTITY a "x">]><rss><channel/></rss>'.encode("utf-16")
        with self.assertRaises(ValueError):
            parse_feed(xml, "RBI", ["rbi.org.in"], "India", "2026-10-31T10:05:00+00:00")

    def test_lookalike_and_subdomain_spoofing_is_rejected(self):
        xml = b"""<rss><channel>
          <item><title>Spoof</title><link>https://rbi.org.in.evil.example/1</link></item>
          <item><title>Spoof2</title><link>https://evilrbi.org.in/1</link></item>
          <item><title>Real subdomain</title><link>https://opportunities.rbi.org.in/1</link></item>
        </channel></rss>"""
        items = parse_feed(xml, "RBI", ["rbi.org.in"], "India", "2026-10-31T10:05:00+00:00")
        self.assertEqual([i["title"] for i in items], ["Real subdomain"])


if __name__ == "__main__":
    unittest.main()
