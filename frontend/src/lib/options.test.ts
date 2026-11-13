import { describe, expect, it } from "vitest";
import { calculateStrategyPayoff, expirySpotGrid, type OptionLeg } from "./options";

const bullCallSpread: OptionLeg[] = [
  { id: "long", optionType: "call", side: "buy", strike: 100, premium: 10, quantity: 1 },
  { id: "short", optionType: "call", side: "sell", strike: 120, premium: 4, quantity: 1 },
];

describe("multi-leg option expiry payoff", () => {
  it("calculates a defined-risk bull call spread and breakeven", () => {
    const result = calculateStrategyPayoff(bullCallSpread, [0, 100, 106, 110, 120, 130]);
    expect(result.netPremium).toBe(-6);
    expect(result.maxLoss).toBe(-6);
    expect(result.maxProfit).toBe(14);
    expect(result.unlimitedProfit).toBe(false);
    expect(result.unlimitedLoss).toBe(false);
    expect(result.breakevens).toContain(106);
  });

  it("flags unlimited loss for an uncovered short call", () => {
    const result = calculateStrategyPayoff([
      { id: "short-call", optionType: "call", side: "sell", strike: 100, premium: 5, quantity: 1 },
    ], [0, 100, 200]);
    expect(result.unlimitedLoss).toBe(true);
    expect(result.maxLoss).toBeNull();
    expect(result.maxProfit).toBe(5);
  });

  it("supports put legs and combined quantities", () => {
    const result = calculateStrategyPayoff([
      { id: "put", optionType: "put", side: "buy", strike: 100, premium: 8, quantity: 2 },
    ], [0, 92, 100, 120]);
    expect(result.points.find((point) => point.spot === 100)?.pnl).toBe(-16);
    expect(result.breakevens).toContain(92);
  });

  it("rejects invalid legs and invalid scenario prices", () => {
    expect(() => calculateStrategyPayoff([], [0, 100])).toThrow(/between 1 and 10/);
    expect(() => calculateStrategyPayoff([{ ...bullCallSpread[0], quantity: 0 }], [0, 100])).toThrow(/valid/);
    expect(() => calculateStrategyPayoff([bullCallSpread[0]], [100])).toThrow(/at least two/);
  });
});

describe("expiry scenario grid", () => {
  it("creates an inclusive spot range", () => {
    const grid = expirySpotGrid(100, 10, 10);
    expect(grid).toHaveLength(11);
    expect(grid[0]).toBe(90);
    expect(grid.at(-1)).toBe(110);
  });

  it("rejects invalid spot or range", () => {
    expect(() => expirySpotGrid(0, 10)).toThrow();
    expect(() => expirySpotGrid(100, 0)).toThrow();
  });
});
