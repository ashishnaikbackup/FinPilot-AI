import { describe, expect, it } from "vitest";
import { clusterNewsEvents, eventTopic, publisherOf, safeHttpsUrl, sanitizeNewsItems, type NewsItem } from "./news";

const item = (title: string, url: string, extra: Partial<NewsItem> = {}): NewsItem => ({ title, url, ...extra });

describe("safeHttpsUrl", () => {
  it("accepts only well-formed https URLs", () => {
    expect(safeHttpsUrl("https://www.rbi.org.in/x")).toBe("https://www.rbi.org.in/x");
    expect(safeHttpsUrl("javascript:alert(1)")).toBeNull();
    expect(safeHttpsUrl("http://example.com")).toBeNull();
    expect(safeHttpsUrl("data:text/html,<b>x</b>")).toBeNull();
    expect(safeHttpsUrl("not a url")).toBeNull();
    expect(safeHttpsUrl(42)).toBeNull();
  });
});

describe("sanitizeNewsItems", () => {
  it("drops unsafe, untitled, duplicate and non-object entries", () => {
    const out = sanitizeNewsItems([
      item("Good", "https://a.example/1"),
      item("Dup", "https://a.example/1"),
      item("Bad scheme", "javascript:alert(1)"),
      { title: "", url: "https://a.example/2" },
      null, 7, "str",
      item("Also good", "https://b.example/2")
    ]);
    expect(out.map(i => i.title)).toEqual(["Good", "Also good"]);
    expect(sanitizeNewsItems(undefined)).toEqual([]);
  });
});

describe("publisherOf", () => {
  it("strips a leading www. (regression: the pattern was previously mis-escaped)", () => {
    expect(publisherOf(item("t", "https://x.example/1", { domain: "www.RBI.org.in" }))).toBe("rbi.org.in");
    expect(publisherOf(item("t", "https://www.sebi.gov.in/a"))).toBe("sebi.gov.in");
  });
  it("never throws on malformed URLs", () => {
    expect(publisherOf(item("t", "::::"))).toBe("unknown");
  });
});

describe("clusterNewsEvents", () => {
  const a = item("RBI keeps repo rate unchanged in monetary policy review", "https://www.rbi.org.in/1", { domain: "www.rbi.org.in", source_type: "official_primary_source" });
  const b = item("RBI holds repo rate steady, monetary policy statement", "https://rbi.org.in/2", { domain: "rbi.org.in", source_type: "official_primary_source" });
  const c = item("Crude oil climbs as OPEC trims supply", "https://news.example/3", { domain: "news.example" });

  it("groups similar headlines and counts www / non-www as one publisher", () => {
    const clusters = clusterNewsEvents([a, b, c]);
    expect(clusters).toHaveLength(2);
    expect(clusters[0].items).toHaveLength(2);
    expect(clusters[0].publishers).toEqual(["rbi.org.in"]);
    expect(clusters[0].officialCount).toBe(2);
    expect(clusters[0].topic).toBe("Central banks & inflation");
    expect(clusters[1].topic).toBe("Energy & commodities");
  });
  it("counts a duplicated URL once and survives malformed entries", () => {
    const clusters = clusterNewsEvents([a, a, { title: "x", url: "::::" }, c]);
    expect(clusters.reduce((n, cl) => n + cl.items.length, 0)).toBe(3);
  });
  it("does not leak internal matching state", () => {
    expect(Object.keys(clusterNewsEvents([a])[0]).sort()).toEqual(["id", "items", "officialCount", "publishers", "title", "topic", "watchFor"]);
  });
  it("falls back to a general topic", () => {
    expect(eventTopic("Quarterly figures released").topic).toBe("General economic & policy");
  });
});
