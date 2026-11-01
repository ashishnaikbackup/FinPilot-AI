export type NewsItem = {
  title: string;
  url: string;
  domain?: string;
  seen_at?: string;
  source_country?: string;
  source?: string;
  source_type?: string;
  published_at?: string | null;
};

export type EventCluster = {
  id: string;
  title: string;
  items: NewsItem[];
  publishers: string[];
  officialCount: number;
  topic: string;
  watchFor: string;
};

/** Returns the URL only if it is a well-formed https URL with a hostname; otherwise null. */
export function safeHttpsUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const parsed = new URL(value.trim());
    return parsed.protocol === "https:" && parsed.hostname ? parsed.toString() : null;
  } catch {
    return null;
  }
}

/** Keep only snapshot items that have a title and a safe https link. Protects the UI from a malformed snapshot. */
export function sanitizeNewsItems(input: unknown): NewsItem[] {
  if (!Array.isArray(input)) return [];
  const seen = new Set<string>();
  const out: NewsItem[] = [];
  for (const raw of input) {
    if (!raw || typeof raw !== "object") continue;
    const item = raw as Record<string, unknown>;
    const url = safeHttpsUrl(item.url);
    if (typeof item.title !== "string" || !item.title.trim() || !url || seen.has(url)) continue;
    seen.add(url);
    out.push({ ...(item as NewsItem), title: item.title.trim(), url });
  }
  return out;
}

/** Lower-cased publisher host without a leading "www."; never throws on malformed input. */
export function publisherOf(item: NewsItem): string {
  let host = (item.domain || "").trim();
  if (!host) {
    try { host = new URL(item.url).hostname; } catch { host = ""; }
  }
  return host.replace(/^www\./i, "").toLowerCase() || "unknown";
}

const EVENT_STOP_WORDS = new Set(["about", "after", "amid", "and", "are", "bank", "banks", "from", "have", "into", "its", "new", "over", "says", "the", "their", "this", "with", "will", "india", "global", "update", "updates"]);

export function eventTopic(text: string): { topic: string; watchFor: string } {
  const value = text.toLowerCase();
  if (/(rbi|reserve bank|interest rate|monetary policy|repo rate|inflation)/.test(value)) return { topic: "Central banks & inflation", watchFor: "Policy rates, borrowing costs, bond yields and currency expectations" };
  if (/(sebi|nse|bse|stock exchange|market regulator|securities)/.test(value)) return { topic: "Markets & regulation", watchFor: "Disclosure obligations, market access, liquidity and investor protection" };
  if (/(budget|tax|gst|fiscal|ministry of finance|government spending)/.test(value)) return { topic: "Fiscal policy & taxation", watchFor: "Household costs, company margins, government borrowing and sector exposure" };
  if (/(oil|crude|energy|gas|opec|commodity)/.test(value)) return { topic: "Energy & commodities", watchFor: "Input costs, inflation, trade balances and energy-sensitive sectors" };
  if (/(trade|tariff|sanction|geopolit|war|conflict|border)/.test(value)) return { topic: "Trade & geopolitics", watchFor: "Supply chains, currencies, commodity routes and policy uncertainty" };
  if (/(bank|lender|credit|loan|deposit|financial stability)/.test(value)) return { topic: "Banking & credit", watchFor: "Funding costs, credit availability, asset quality and depositor risk" };
  if (/(company|corporate|earnings|profit|revenue|merger|acquisition|ipo|listing)/.test(value)) return { topic: "Companies & corporate actions", watchFor: "Issuer filings, earnings quality, valuation, dilution and execution risk" };
  return { topic: "General economic & policy", watchFor: "Check the primary document and identify which sectors or households are directly affected" };
}

function keywordSet(title: string): Set<string> {
  return new Set((title.toLowerCase().match(/[a-z0-9]{4,}/g) || []).filter(token => !EVENT_STOP_WORDS.has(token)));
}

/**
 * Heuristic grouping by title-keyword overlap. Grouping does NOT verify that items describe the
 * same event, and distinct publisher domains do NOT prove independent reporting.
 */
export function clusterNewsEvents(items: NewsItem[]): EventCluster[] {
  const clusters: (EventCluster & { keys: Set<string> })[] = [];
  const seenUrls = new Set<string>();
  for (const item of items) {
    if (!item || typeof item.title !== "string" || typeof item.url !== "string" || seenUrls.has(item.url)) continue;
    seenUrls.add(item.url);
    const tokens = keywordSet(item.title);
    let best: (typeof clusters)[number] | undefined;
    let bestScore = 0;
    for (const cluster of clusters) {
      const overlap = [...tokens].filter(token => cluster.keys.has(token)).length;
      const score = overlap / Math.max(1, Math.min(tokens.size, cluster.keys.size));
      if (overlap >= 2 && score > bestScore && score >= 0.5) { best = cluster; bestScore = score; }
    }
    if (!best) {
      best = { id: item.url, title: item.title, items: [], publishers: [], officialCount: 0, keys: tokens, ...eventTopic(item.title) };
      clusters.push(best);
    }
    best.items.push(item);
    const publisher = publisherOf(item);
    if (!best.publishers.includes(publisher)) best.publishers.push(publisher);
    if (item.source_type === "official_primary_source") best.officialCount += 1;
  }
  return clusters
    .sort((a, b) => b.items.length - a.items.length || b.officialCount - a.officialCount)
    .slice(0, 12)
    .map(({ keys: _keys, ...cluster }) => cluster);
}
