"""Safe parser for public RSS/Atom source feeds."""
import xml.etree.ElementTree as ET
from urllib.parse import urlparse
from xml.parsers import expat


def reject_dtd(xml_content):
    """Refuse feeds that declare a DOCTYPE/DTD.

    Legitimate RSS/Atom feeds never need one, and DTD/entity declarations are the
    mechanism behind entity-expansion attacks on XML parsers. Works for every
    encoding because the check is done by expat itself, before ElementTree runs.
    """
    parser = expat.ParserCreate()

    def forbid(*_args):
        raise ValueError("Feed rejected: DOCTYPE declarations are not allowed")

    parser.StartDoctypeDeclHandler = forbid
    parser.Parse(xml_content, True)


def parse_feed(xml_content, provider, allowed_domains, country, retrieved_at, limit=8):
    reject_dtd(xml_content)
    root = ET.fromstring(xml_content)
    items = root.findall(".//item")
    if not items:
        items = root.findall(".//{*}entry")
    normalized = []

    def child_text(element, name):
        child = element.find(name)
        if child is None:
            child = element.find(f"{{*}}{name}")
        return (child.text or "").strip() if child is not None and child.text else ""

    for item in items[:limit]:
        title = child_text(item, "title")
        link_element = item.find("link")
        if link_element is None:
            link_element = item.find("{*}link")
        link = ((link_element.text or "").strip() if link_element is not None and link_element.text else "")
        if not link and link_element is not None:
            link = (link_element.attrib.get("href") or "").strip()
        parsed_link = urlparse(link)
        domain = (parsed_link.hostname or "").lower()
        published = (
            child_text(item, "pubDate")
            or child_text(item, "published")
            or child_text(item, "updated")
            or child_text(item, "date")
        )
        allowed = any(domain == item_domain or domain.endswith("." + item_domain) for item_domain in allowed_domains)
        if not title or parsed_link.scheme != "https" or not domain or not allowed:
            continue
        normalized.append({
            "title": title,
            "url": link,
            "domain": domain,
            "source": provider,
            "source_type": "official_primary_source",
            "published_at": published or None,
            "seen_at": retrieved_at,
            "source_country": country,
        })
    return normalized
