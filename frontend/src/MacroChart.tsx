import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export type MacroPoint = { date: string; value: number };

/** Loaded lazily from App so the charting library stays out of the initial bundle. */
export default function MacroChart({ data }: { data: MacroPoint[] }) {
  return <ResponsiveContainer width="100%" height="100%">
    <AreaChart data={data} margin={{ top: 12, right: 4, left: -20, bottom: 0 }}>
      <defs><linearGradient id="macro" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#8490ff" stopOpacity={0.28} /><stop offset="100%" stopColor="#8490ff" stopOpacity={0} /></linearGradient></defs>
      <CartesianGrid stroke="#222b40" vertical={false} />
      <XAxis dataKey="date" tick={{ fill: "#77839c", fontSize: 10 }} axisLine={false} tickLine={false} />
      <YAxis tick={{ fill: "#77839c", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => (v / 1e12).toFixed(1) + "T"} />
      <Tooltip formatter={(v) => "$" + (Number(v) / 1e12).toFixed(2) + " trillion"} contentStyle={{ background: "#111a2c", border: "1px solid #2b3852", borderRadius: 12, color: "#fff" }} />
      <Area type="monotone" dataKey="value" name="GDP" stroke="#8490ff" strokeWidth={2.5} fill="url(#macro)" />
    </AreaChart>
  </ResponsiveContainer>;
}
