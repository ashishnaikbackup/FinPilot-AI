/** Safe, validated access to browser-local data. Nothing here ever throws on bad input. */

export type Holding = { name: string; amount: number; category: string };
export type PaperPosition = { id: number; symbol: string; quantity: number; entryPrice: number; markPrice: number; fees: number; updatedAt: string };

export const HOLDINGS_KEY = "finpilot-holdings";
export const PAPER_KEY = "finpilot-paper-positions";
export const RESEARCH_KEY = "finpilot-research-cases";
export const MAX_HOLDINGS = 200;
export const MAX_PAPER_POSITIONS = 200;
export const MAX_IMPORT_BYTES = 1_000_000;

function parseArray(raw: string | null): unknown[] {
  if (!raw) return [];
  try {
    const value: unknown = JSON.parse(raw);
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

export function readStored(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}

/** Returns false when the browser refuses to store (private mode, quota, disabled storage). */
export function writeStored(key: string, value: unknown): boolean {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; }
}

function cleanHolding(item: unknown, requirePositive: boolean): Holding | null {
  if (!item || typeof item !== "object") return null;
  const h = item as Record<string, unknown>;
  const amount = Number(h.amount);
  if (typeof h.name !== "string" || !h.name.trim() || !Number.isFinite(amount) || amount < 0 || (requirePositive && amount <= 0)) return null;
  return {
    name: h.name.trim().slice(0, 100),
    amount,
    category: typeof h.category === "string" && h.category.trim() ? h.category.slice(0, 60) : "Other"
  };
}

export function hydrateHoldings(raw: string | null): Holding[] {
  return parseArray(raw).map(item => cleanHolding(item, false)).filter((h): h is Holding => h !== null).slice(0, MAX_HOLDINGS);
}

export function loadHoldings(): Holding[] {
  return hydrateHoldings(readStored(HOLDINGS_KEY));
}

/** Unique ids: stored ids are kept when valid and unused; otherwise a fresh one is issued. */
export function nextId(used: Set<number>): number {
  let id = Date.now();
  while (used.has(id)) id += 1;
  used.add(id);
  return id;
}

export function hydratePaperPositions(raw: string | null): PaperPosition[] {
  const used = new Set<number>();
  const out: PaperPosition[] = [];
  for (const item of parseArray(raw)) {
    if (!item || typeof item !== "object") continue;
    const p = item as Record<string, unknown>;
    const quantity = Number(p.quantity), entryPrice = Number(p.entryPrice), markPrice = Number(p.markPrice);
    if (typeof p.symbol !== "string" || !p.symbol.trim() || !(quantity > 0) || !(entryPrice > 0) || !Number.isFinite(markPrice) || markPrice < 0) continue;
    const storedId = Number(p.id);
    const id = Number.isInteger(storedId) && storedId > 0 && !used.has(storedId) ? (used.add(storedId), storedId) : nextId(used);
    out.push({
      id,
      symbol: p.symbol.trim().slice(0, 40),
      quantity, entryPrice, markPrice,
      fees: Math.max(0, Number(p.fees) || 0),
      updatedAt: typeof p.updatedAt === "string" ? p.updatedAt : ""
    });
  }
  return out.slice(0, MAX_PAPER_POSITIONS);
}

export type BackupResult = { holdings: Holding[]; skipped: number; duplicates: number };

/**
 * Validate an asset backup file's text. Accepts `{ holdings: [...] }` or a bare array.
 * Throws an Error with a user-readable message when the file is not usable.
 */
export function parseHoldingsBackup(text: string, existing: Holding[]): BackupResult {
  if (text.length > MAX_IMPORT_BYTES) throw new Error("This file is too large to be an asset backup (limit 1 MB).");
  let parsed: unknown;
  try { parsed = JSON.parse(text); } catch { throw new Error("This file is not valid JSON."); }
  const incoming = Array.isArray(parsed) ? parsed : (parsed as { holdings?: unknown } | null)?.holdings;
  if (!Array.isArray(incoming)) throw new Error("This file does not contain an asset backup.");
  const key = (h: Holding) => `${h.name}\u0000${h.amount}\u0000${h.category}`;
  const known = new Set(existing.map(key));
  const accepted: Holding[] = [];
  let skipped = 0, duplicates = 0;
  for (const item of incoming) {
    const holding = cleanHolding(item, true);
    if (!holding) { skipped += 1; continue; }
    if (known.has(key(holding))) { duplicates += 1; continue; }
    known.add(key(holding));
    accepted.push(holding);
  }
  const room = Math.max(0, MAX_HOLDINGS - existing.length);
  if (!accepted.length && !duplicates) throw new Error("No valid asset entries were found.");
  return { holdings: accepted.slice(0, room), skipped: skipped + Math.max(0, accepted.length - room), duplicates };
}

/** Download JSON without revoking the object URL before the browser has started the download. */
export function downloadJson(filename: string, payload: unknown): void {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
