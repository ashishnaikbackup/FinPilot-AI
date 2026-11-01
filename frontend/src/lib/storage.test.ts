import { describe, expect, it } from "vitest";
import { MAX_HOLDINGS, hydrateHoldings, hydratePaperPositions, nextId, parseHoldingsBackup, type Holding } from "./storage";

describe("hydratePaperPositions", () => {
  it("assigns unique ids when stored ids are missing or duplicated (regression: removing one used to remove all)", () => {
    const raw = JSON.stringify([
      { symbol: "A", quantity: 1, entryPrice: 10, markPrice: 11 },
      { symbol: "B", quantity: 2, entryPrice: 10, markPrice: 12 },
      { id: 5, symbol: "C", quantity: 1, entryPrice: 1, markPrice: 1 },
      { id: 5, symbol: "D", quantity: 1, entryPrice: 1, markPrice: 1 }
    ]);
    const out = hydratePaperPositions(raw);
    expect(out).toHaveLength(4);
    expect(new Set(out.map(p => p.id)).size).toBe(4);
  });
  it("drops invalid rows and tolerates garbage", () => {
    const raw = JSON.stringify([
      { symbol: "", quantity: 1, entryPrice: 1, markPrice: 1 },
      { symbol: "X", quantity: -1, entryPrice: 1, markPrice: 1 },
      { symbol: "Y", quantity: 1, entryPrice: 0, markPrice: 1 },
      { symbol: "Z", quantity: 1, entryPrice: 1, markPrice: -1 },
      null, "s", 3,
      { symbol: "OK", quantity: 1, entryPrice: 1, markPrice: 0, fees: -5 }
    ]);
    const out = hydratePaperPositions(raw);
    expect(out.map(p => p.symbol)).toEqual(["OK"]);
    expect(out[0].fees).toBe(0);
    expect(hydratePaperPositions("{not json")).toEqual([]);
    expect(hydratePaperPositions(null)).toEqual([]);
    expect(hydratePaperPositions('{"a":1}')).toEqual([]);
  });
});

describe("hydrateHoldings", () => {
  it("keeps valid entries and defaults the category", () => {
    const out = hydrateHoldings(JSON.stringify([{ name: " Savings ", amount: "500" }, { name: "", amount: 5 }, { name: "Neg", amount: -1 }]));
    expect(out).toEqual([{ name: "Savings", amount: 500, category: "Other" }]);
  });
});

describe("parseHoldingsBackup", () => {
  const existing: Holding[] = [{ name: "Savings", amount: 1000, category: "Cash & deposits" }];
  it("accepts wrapped and bare-array backups", () => {
    const wrapped = parseHoldingsBackup(JSON.stringify({ holdings: [{ name: "Gold", amount: 200, category: "Gold / commodities" }] }), existing);
    expect(wrapped.holdings).toHaveLength(1);
    expect(parseHoldingsBackup(JSON.stringify([{ name: "A", amount: 1, category: "Other" }]), []).holdings).toHaveLength(1);
  });
  it("skips duplicates of existing entries (restoring the same backup twice must not double totals)", () => {
    const r = parseHoldingsBackup(JSON.stringify({ holdings: [{ name: "Savings", amount: 1000, category: "Cash & deposits" }] }), existing);
    expect(r.holdings).toHaveLength(0);
    expect(r.duplicates).toBe(1);
  });
  it("counts invalid rows and rejects unusable files with readable messages", () => {
    const r = parseHoldingsBackup(JSON.stringify([{ name: "A", amount: 1, category: "x" }, { name: "B", amount: 0, category: "x" }, { amount: 5 }]), []);
    expect(r.holdings).toHaveLength(1);
    expect(r.skipped).toBe(2);
    expect(() => parseHoldingsBackup("not json", [])).toThrow("not valid JSON");
    expect(() => parseHoldingsBackup('{"foo":1}', [])).toThrow("does not contain an asset backup");
    expect(() => parseHoldingsBackup("[]", [])).toThrow("No valid asset entries");
    expect(() => parseHoldingsBackup("x".repeat(1_000_001), [])).toThrow("too large");
  });
  it("respects the entry limit", () => {
    const many = Array.from({ length: MAX_HOLDINGS + 20 }, (_, i) => ({ name: "N" + i, amount: i + 1, category: "Other" }));
    const r = parseHoldingsBackup(JSON.stringify(many), []);
    expect(r.holdings).toHaveLength(MAX_HOLDINGS);
    expect(r.skipped).toBe(20);
  });
});

describe("nextId", () => {
  it("never returns an id already in use", () => {
    const used = new Set<number>();
    const ids = Array.from({ length: 50 }, () => nextId(used));
    expect(new Set(ids).size).toBe(50);
  });
});
