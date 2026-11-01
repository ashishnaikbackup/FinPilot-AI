import { describe, expect, it } from "vitest";
import { DEBT_OK, debtPayoff, emergencyFund, goalPlan, money, paperPnl, parseAmount, price, sipProjection } from "./finance";

// Expected values below were computed independently (closed form + brute-force accumulation).
describe("parseAmount", () => {
  it("clamps and rejects non-finite input", () => {
    expect(parseAmount("abc")).toBe(0);
    expect(parseAmount("")).toBe(0);
    expect(parseAmount("-5")).toBe(0);
    expect(parseAmount("1e999")).toBe(0);
    expect(parseAmount(500, 0, 100)).toBe(100);
    expect(parseAmount("-80", -50, 50)).toBe(-50);
  });
});

describe("formatting", () => {
  it("shows unit prices to two decimals so small differences are not hidden", () => {
    expect(price(99.5)).toContain("99.50");
    expect(price(-130)).toContain("130.00");
    expect(money(99.5)).toContain("100"); // whole-rupee rounding is for totals only
    expect(money(Number.NaN)).toBe("—");
    expect(price(Number.POSITIVE_INFINITY)).toBe("—");
  });
});

describe("sipProjection (nominal rate / 12, month-end contributions)", () => {
  it("matches the closed-form annuity value", () => {
    const r = sipProjection(5000, 10, 12);
    expect(r.futureValue).toBeCloseTo(1150193.45, 1);
    expect(r.invested).toBe(600000);
    expect(r.gain).toBeCloseTo(550193.45, 1);
    expect(r.months).toBe(120);
  });
  it("handles zero and negative returns and empty input", () => {
    expect(sipProjection(1000, 5, 0).futureValue).toBe(60000);
    expect(sipProjection(1000, 5, -10).futureValue).toBeLessThan(60000);
    expect(sipProjection(1000, 0, 10).futureValue).toBe(0);
    expect(sipProjection(Number.NaN, 10, 10).futureValue).toBe(0);
  });
});

describe("goalPlan (effective annual rates)", () => {
  it("inflates the goal and divides the gap evenly at 0% return", () => {
    const g = goalPlan({ target: 100000, current: 0, years: 5, inflationPct: 5, returnPct: 0 });
    expect(g.futureTarget).toBeCloseTo(127628.15625, 4);
    expect(g.zeroReturnMonthly).toBeCloseTo(2127.1359, 3);
    expect(g.monthlyAtAssumption).toBeCloseTo(g.zeroReturnMonthly, 6);
  });
  it("needs a smaller monthly contribution when a positive return is assumed", () => {
    const g = goalPlan({ target: 1_000_000, current: 0, years: 5, inflationPct: 0, returnPct: 8 });
    expect(g.monthlyAtAssumption).toBeCloseTo(13709.02, 1);
    expect(g.monthlyAtAssumption).toBeLessThan(g.zeroReturnMonthly);
  });
  it("never goes negative when the goal is already funded, and tolerates bad input", () => {
    const funded = goalPlan({ target: 100, current: 1_000_000, years: 3, inflationPct: 5, returnPct: 8 });
    expect(funded.zeroReturnMonthly).toBe(0);
    expect(funded.monthlyAtAssumption).toBe(0);
    const bad = goalPlan({ target: "x", current: "-3", years: "", inflationPct: "999", returnPct: "-4" });
    expect(Number.isFinite(bad.futureTarget)).toBe(true);
    expect(bad.monthlyAtAssumption).toBe(0);
  });
});

describe("debtPayoff", () => {
  it("amortises to the expected month count and interest", () => {
    const d = debtPayoff(100000, 12, 10000);
    expect(d.status).toBe(DEBT_OK);
    expect(d.months).toBe(11);
    expect(d.interest).toBeCloseTo(5898.49, 1);
    expect(d.totalPaid).toBeCloseTo(105898.49, 1);
  });
  it("handles zero interest, interest-only traps and empty fields", () => {
    const zero = debtPayoff(12000, 0, 1000);
    expect(zero.months).toBe(12);
    expect(zero.interest).toBe(0);
    expect(zero.totalPaid).toBe(12000);
    expect(debtPayoff(100000, 24, 1000).status).toBe("Payment does not cover monthly interest");
    expect(debtPayoff(100000, 12, 0).status).toBe("Enter a monthly payment");
    expect(debtPayoff(0, 12, 500).status).toBe("No outstanding balance");
  });
  it("caps absurdly long payoffs", () => {
    expect(debtPayoff(10_000_000, 1, 8400).status).toBe("More than 100 years");
  });
});

describe("emergencyFund", () => {
  it("computes surplus, target and remaining gap", () => {
    expect(emergencyFund(50000, 30000, 6, 60000)).toEqual({ surplus: 20000, target: 180000, gap: 120000 });
    expect(emergencyFund(10000, 30000, 6, 500000).gap).toBe(0);
    expect(emergencyFund("", "", 6, "").target).toBe(0);
  });
});

describe("paperPnl", () => {
  it("is fee-aware and relative to entry cost", () => {
    const r = paperPnl({ quantity: 10, entryPrice: 100.5, markPrice: 110.25, fees: 25 });
    expect(r.cost).toBe(1005);
    expect(r.value).toBe(1102.5);
    expect(r.pnl).toBeCloseTo(72.5, 6);
    expect(r.pct).toBeCloseTo(7.2139, 3);
  });
  it("shows a loss when fees exceed the gain", () => {
    expect(paperPnl({ quantity: 1, entryPrice: 100, markPrice: 101, fees: 5 }).pnl).toBe(-4);
  });
});
