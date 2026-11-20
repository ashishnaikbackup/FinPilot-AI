import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export type MacroPoint = { date: string; value: number };

/** Loaded lazily from App so the charting library stays out of the initial bundle. */
export default function MacroChart({ data }: { data: MacroPoint[] }) {
  return <ResponsiveContainer width="100%" height="100%">
    <AreaChart data={data} margin={{ top: 12, right: 4, left: -20, bottom: 0 }}>
      <defs><linearGradient id="macro" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#8490ff" stopOpacity={0.28} /><stop offset="100%" stopColor="#8490ff" stopOpacity={0} /></linearGradient></defs>
      <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
      <XAxis dataKey="date" tick={{ fill: "var(--chart-tick)", fontSize: 10 }} axisLine={false} tickLine={false} />
      <YAxis tick={{ fill: "var(--chart-tick)", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => (v / 1e12).toFixed(1) + "T"} />
      <Tooltip formatter={(v) => "$" + (Number(v) / 1e12).toFixed(2) + " trillion"} contentStyle={{ background: "var(--chart-tip-bg)", border: "1px solid var(--chart-tip-border)", borderRadius: 12, color: "var(--chart-tip-text)" }} />
      <Area type="monotone" dataKey="value" name="GDP" stroke="#8490ff" strokeWidth={2.5} fill="url(#macro)" />
    </AreaChart>
  </ResponsiveContainer>;
}
