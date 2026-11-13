export type OptionType = "call" | "put";
export type OptionSide = "buy" | "sell";
export type OptionLeg = {
  id: string;
  optionType: OptionType;
  side: OptionSide;
  strike: number;
  premium: number;
  quantity: number;
};
export type PayoffPoint = { spot: number; pnl: number };
export type StrategyPayoff = {
  points: PayoffPoint[];
  breakevens: number[];
  maxProfit: number | null;
  maxLoss: number | null;
  unlimitedProfit: boolean;
  unlimitedLoss: boolean;
  netPremium: number;
};

export function calculateStrategyPayoff(legs: OptionLeg[], spots: number[]): StrategyPayoff {
  if (!Array.isArray(legs) || legs.length < 1 || legs.length > 10) {
    throw new Error("Add between 1 and 10 option legs.");
  }
  for (const leg of legs) {
    if (!["call", "put"].includes(leg.optionType) || !["buy", "sell"].includes(leg.side)
      || !Number.isFinite(leg.strike) || leg.strike <= 0
      || !Number.isFinite(leg.premium) || leg.premium < 0
      || !Number.isInteger(leg.quantity) || leg.quantity <= 0) {
      throw new Error("Each leg needs a valid type, side, positive strike and whole-unit quantity, and non-negative premium.");
    }
  }
  const cleanSpots = [...new Set(spots)].sort((a, b) => a - b);
  if (cleanSpots.length < 2 || cleanSpots.some((spot) => !Number.isFinite(spot) || spot < 0)) {
    throw new Error("Provide at least two valid non-negative expiry spot prices.");
  }

  const points = cleanSpots.map((spot) => {
    const pnl = legs.reduce((total, leg) => {
      const intrinsic = leg.optionType === "call"
        ? Math.max(spot - leg.strike, 0)
        : Math.max(leg.strike - spot, 0);
      const direction = leg.side === "buy" ? 1 : -1;
      return total + direction * (intrinsic - leg.premium) * leg.quantity;
    }, 0);
    return { spot, pnl: Math.round(pnl * 100) / 100 };
  });

  const breakevens: number[] = [];
  for (let i = 0; i < points.length - 1; i += 1) {
    const left = points[i], right = points[i + 1];
    if (left.pnl === 0) breakevens.push(left.spot);
    else if ((left.pnl < 0 && right.pnl > 0) || (left.pnl > 0 && right.pnl < 0)) {
      const crossing = left.spot + (right.spot - left.spot) * (-left.pnl) / (right.pnl - left.pnl);
      breakevens.push(Math.round(crossing * 100) / 100);
    }
  }
  const finalPoint = points[points.length - 1];
  if (finalPoint.pnl === 0) breakevens.push(finalPoint.spot);

  const netCallUnits = legs.reduce((total, leg) => {
    if (leg.optionType !== "call") return total;
    return total + (leg.side === "buy" ? 1 : -1) * leg.quantity;
  }, 0);
  const values = points.map((point) => point.pnl);
  const unlimitedProfit = netCallUnits > 0;
  const unlimitedLoss = netCallUnits < 0;
  const maxProfit = unlimitedProfit ? null : Math.max(...values);
  const maxLoss = unlimitedLoss ? null : Math.min(...values);
  const netPremium = legs.reduce((total, leg) => total + (leg.side === "sell" ? 1 : -1) * leg.premium * leg.quantity, 0);

  return {
    points,
    breakevens: [...new Set(breakevens)],
    maxProfit: maxProfit === null ? null : Math.round(maxProfit * 100) / 100,
    maxLoss: maxLoss === null ? null : Math.round(maxLoss * 100) / 100,
    unlimitedProfit,
    unlimitedLoss,
    netPremium: Math.round(netPremium * 100) / 100,
  };
}

export function expirySpotGrid(center: number, rangePct = 15, steps = 30): number[] {
  if (!Number.isFinite(center) || center <= 0 || !Number.isFinite(rangePct) || rangePct <= 0
    || !Number.isInteger(steps) || steps < 2 || steps > 200) {
    throw new Error("Enter a positive underlying spot and a valid scenario range.");
  }
  const low = Math.max(0, center * (1 - rangePct / 100));
  const high = center * (1 + rangePct / 100);
  return Array.from({ length: steps + 1 }, (_, i) => Math.round((low + (high - low) * i / steps) * 100) / 100);
}
