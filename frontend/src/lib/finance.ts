/**
 * Pure financial helpers. Every function is deterministic, side-effect free and
 * documents its convention, so the maths can be unit-tested and audited.
 * All results are illustrations based on user-entered assumptions, not forecasts.
 */

/** Convert free-form input to a finite number clamped to [min, max]; invalid input becomes `min`. */
export function parseAmount(value: string | number, min = 0, max = Number.POSITIVE_INFINITY): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}

const inr0 = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const inr2 = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Whole-rupee display for totals and planning figures. */
export function money(value: number): string {
  return Number.isFinite(value) ? inr0.format(value) : "—";
}

/** Two-decimal display for unit prices, so ₹99.50 is never shown as ₹100. */
export function price(value: number): string {
  return Number.isFinite(value) ? inr2.format(value) : "—";
}

export type SipResult = { futureValue: number; invested: number; gain: number; months: number };

/**
 * SIP illustration. Convention: the rate is a NOMINAL annual rate divided by 12
 * (monthly compounding), with contributions at the END of each month (ordinary annuity).
 * This is the convention most simple Indian SIP calculators use; it differs from the
 * goal planner, which treats the rate as an EFFECTIVE annual rate.
 */
export function sipProjection(monthly: number, years: number, annualRatePct: number): SipResult {
  const p = parseAmount(monthly, 0, 100_000_000);
  const months = Math.round(parseAmount(years, 0, 60) * 12);
  const r = parseAmount(annualRatePct, -50, 50) / 1200;
  if (!months) return { futureValue: 0, invested: 0, gain: 0, months: 0 };
  const futureValue = r === 0 ? p * months : p * ((Math.pow(1 + r, months) - 1) / r);
  const invested = p * months;
  return { futureValue, invested, gain: futureValue - invested, months };
}

export type GoalPlan = { futureTarget: number; zeroReturnMonthly: number; monthlyAtAssumption: number; months: number };

/**
 * Inflation-aware goal plan. Convention: inflation and return are EFFECTIVE annual rates,
 * converted to a monthly rate with (1+r)^(1/12)-1; contributions at the end of each month.
 */
export function goalPlan(input: { target: number | string; current: number | string; years: number | string; inflationPct: number | string; returnPct: number | string }): GoalPlan {
  const target = parseAmount(input.target);
  const current = parseAmount(input.current);
  const months = Math.min(600, parseAmount(input.years) * 12);
  const inflation = parseAmount(input.inflationPct, 0, 30) / 100;
  const annualReturn = parseAmount(input.returnPct, 0, 30) / 100;
  const futureTarget = target * Math.pow(1 + inflation, months / 12);
  const zeroReturnMonthly = months > 0 ? Math.max(0, futureTarget - current) / months : 0;
  const monthlyRate = Math.pow(1 + annualReturn, 1 / 12) - 1;
  const futureCurrent = current * Math.pow(1 + monthlyRate, months);
  const gap = Math.max(0, futureTarget - futureCurrent);
  const monthlyAtAssumption = months > 0 ? (monthlyRate === 0 ? gap / months : gap * monthlyRate / (Math.pow(1 + monthlyRate, months) - 1)) : 0;
  return { futureTarget, zeroReturnMonthly, monthlyAtAssumption, months };
}

export type DebtResult = { months: number; interest: number; totalPaid: number; status: string };

export const DEBT_OK = "Illustrative payoff estimate";

/** Fixed-rate, fixed-payment payoff with monthly interest (annual rate / 12). Capped at 100 years. */
export function debtPayoff(balanceInput: number | string, annualRatePct: number | string, paymentInput: number | string): DebtResult {
  let balance = parseAmount(balanceInput);
  const payment = parseAmount(paymentInput);
  const monthlyRate = parseAmount(annualRatePct, 0, 100) / 1200;
  if (!balance) return { months: 0, interest: 0, totalPaid: 0, status: "No outstanding balance" };
  if (!payment) return { months: 0, interest: 0, totalPaid: 0, status: "Enter a monthly payment" };
  if (monthlyRate > 0 && payment <= balance * monthlyRate) return { months: 0, interest: 0, totalPaid: 0, status: "Payment does not cover monthly interest" };
  let months = 0, interest = 0, totalPaid = 0;
  while (balance > 0.01 && months < 1200) {
    const charge = balance * monthlyRate;
    const paid = Math.min(balance + charge, payment);
    interest += charge;
    totalPaid += paid;
    balance = Math.max(0, balance + charge - paid);
    months += 1;
  }
  return { months, interest, totalPaid, status: months >= 1200 ? "More than 100 years" : DEBT_OK };
}

export type EmergencyResult = { surplus: number; target: number; gap: number };

export function emergencyFund(income: number | string, expenses: number | string, months: number | string, reserve: number | string): EmergencyResult {
  const inc = parseAmount(income);
  const exp = parseAmount(expenses);
  const target = exp * parseAmount(months, 0, 60);
  return { surplus: inc - exp, target, gap: Math.max(0, target - parseAmount(reserve)) };
}

export type PaperPnl = { cost: number; value: number; fees: number; pnl: number; pct: number };

/**
 * Illustrative unrealised P/L for a manually priced paper position.
 * pnl = quantity*(mark-entry) - fees. The percentage is relative to the entry cost
 * (quantity*entry) and does NOT include fees in the denominator.
 */
export function paperPnl(p: { quantity: number; entryPrice: number; markPrice: number; fees: number }): PaperPnl {
  const cost = p.quantity * p.entryPrice;
  const value = p.quantity * p.markPrice;
  const pnl = value - cost - p.fees;
  return { cost, value, fees: p.fees, pnl, pct: cost > 0 ? (pnl / cost) * 100 : 0 };
}
