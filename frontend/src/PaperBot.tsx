import { useEffect, useState } from "react";
import { Activity, RefreshCw, ShieldCheck } from "lucide-react";

type Signal = {
  symbol: string; market: string; currency: string; price: number;
  ema20: number; ema50: number; rsi14: number; atr14: number;
  signal: "BUY" | "WATCH" | "EXIT"; reason: string;
};
type Position = {
  symbol: string; market: string; currency: string; quantity: number;
  entry_price: number; last_price: number; stop: number; target: number;
};
type Trade = { symbol: string; quantity: number; entry_price: number; exit_price: number; pnl: number; closed_at: string; reason: string };
type Report = {
  status: string; generated_at: string | null; mode: string; strategy: string;
  data: { status: string; provider?: string; as_of?: string; freshness?: string; message?: string; note?: string };
  summary: { open_positions: number; closed_trades: number; cash: number; equity: number; realised_pnl: number; unrealised_pnl: number };
  signals: Signal[]; positions: Position[]; pending_orders?: { symbol: string; signal_as_of: string; created_at: string }[]; recent_trades: Trade[]; limitations: string[];
};

const money = (value: number, currency = "INR") => {
  try { return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 2 }).format(value); }
  catch { return value.toFixed(2) + " " + currency; }
};
const date = (value?: string | null) => value ? new Date(value).toLocaleString("en-IN") : "Not available";

export default function PaperBot() {
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  async function refresh() {
    try {
      const response = await fetch(import.meta.env.BASE_URL + "data/paper-bot.json", { cache: "no-store" });
      if (!response.ok) throw new Error("Paper-bot report is not published yet.");
      setReport(await response.json());
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load the paper-bot report.");
    } finally { setLoading(false); }
  }
  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => { if (document.visibilityState === "visible") void refresh(); }, 5 * 60 * 1000);
    return () => window.clearInterval(timer);
  }, []);
  const ready = report?.status === "available";
  return <div className="workspace-stack">
    <div className="panel workspace-panel">
      <div className="panel-heading">
        <div><div className="eyebrow">AUTONOMOUS SIMULATION · NO BROKER CONNECTION</div><h2>FinPilot paper trader</h2></div>
        <button className="subtle-button" type="button" onClick={() => { setLoading(true); void refresh(); }}><RefreshCw size={14}/> Refresh report</button>
      </div>
      <p>Rules-based research agent that scans the connected quote snapshot, explains its signals and manages hypothetical positions. It never places real orders.</p>
      <div className="calc-result"><span>Engine status</span><b>{loading ? "Loading…" : ready ? "Running · paper only" : "Waiting for permitted market data"}</b></div>
      <div className="calc-result"><span>Market-data source</span><b>{report?.data?.provider || report?.data?.message || "No quote provider connected"}</b></div>
      <div className="calc-result"><span>Source as-of / freshness</span><b>{date(report?.data?.as_of)} · {report?.data?.freshness || "unavailable"}</b></div>
      <div className="calc-result"><span>Last engine run</span><b>{date(report?.generated_at)}</b></div>
      {error && <p className="calc-foot" role="status">{error}</p>}
      {!ready && <div className="empty-data"><ShieldCheck size={18}/> No prices are fabricated and no trades are opened until a permitted, timestamped market-data feed is available. The Cloudflare URL and bot read-token form are not part of this GitHub-native workflow.</div>}
    </div>
    <div className="panel workspace-panel">
      <div className="eyebrow">VIRTUAL ACCOUNT</div><h2>Paper performance</h2>
      <div className="calculator-grid">
        <div className="calculator-card"><span>Virtual equity</span><b>{money(report?.summary?.equity ?? 1000000)}</b></div>
        <div className="calculator-card"><span>Available cash</span><b>{money(report?.summary?.cash ?? 1000000)}</b></div>
        <div className="calculator-card"><span>Realised P&amp;L</span><b>{money(report?.summary?.realised_pnl ?? 0)}</b></div>
        <div className="calculator-card"><span>Unrealised P&amp;L</span><b>{money(report?.summary?.unrealised_pnl ?? 0)}</b></div>
      </div>
      <div className="calc-result"><span>Open positions · closed trades</span><b>{report?.summary?.open_positions ?? 0} · {report?.summary?.closed_trades ?? 0}</b></div>
      <p className="calc-foot">Starting virtual capital: ₹10,00,000. This is simulated capital, not a real account balance or investment recommendation.</p>
    </div>
    <div className="panel workspace-panel">
      <div className="eyebrow">MARKET SCANNER</div><h2>Agent decisions</h2>
      {report?.signals?.length ? <div className="holding-list">{report.signals.map(item => <div className="research-news-item" key={item.symbol}>
        <div className="news-meta"><b>{item.symbol} · {item.market}</b><small>{item.signal} · {item.currency} {item.price}</small></div>
        <div className="calc-result"><span>EMA20 / EMA50 · RSI14</span><b>{item.ema20} / {item.ema50} · {item.rsi14}</b></div>
        <p className="calc-foot">{item.reason}</p>
      </div>)}</div> : <div className="empty-data"><Activity size={18}/> No instrument signals yet. The scanner needs at least 51 valid daily OHLC bars per instrument.</div>}
    </div>
    <div className="panel workspace-panel">
      <div className="eyebrow">NEXT-SESSION QUEUE</div><h2>Pending paper entries</h2>
      {report?.pending_orders?.length ? <div className="holding-list">{report.pending_orders.map((item, index) => <div className="research-news-item" key={item.symbol + item.signal_as_of + index}>
        <div className="news-meta"><b>{item.symbol}</b><small>BUY signal · waiting for a later session open</small></div>
        <div className="calc-result"><span>Signal candle</span><b>{date(item.signal_as_of)}</b></div>
      </div>)}</div> : <div className="empty-data">No pending paper entries.</div>}
    </div>
    <div className="panel workspace-panel">
      <div className="eyebrow">OPEN SIMULATED POSITIONS</div><h2>Position management</h2>
      {report?.positions?.length ? <div className="holding-list">{report.positions.map(item => <div className="research-news-item" key={item.symbol}>
        <div className="news-meta"><b>{item.symbol}</b><small>{item.quantity} units · {item.market}</small></div>
        <div className="calc-result"><span>Entry · latest mark</span><b>{money(item.entry_price, item.currency)} · {money(item.last_price, item.currency)}</b></div>
        <div className="calc-result"><span>Stop · target</span><b>{money(item.stop, item.currency)} · {money(item.target, item.currency)}</b></div>
      </div>)}</div> : <div className="empty-data">No open paper positions.</div>}
    </div>
    <div className="panel workspace-panel">
      <div className="eyebrow">TRADE JOURNAL</div><h2>Recent closed trades</h2>
      {report?.recent_trades?.length ? <div className="holding-list">{report.recent_trades.map((item, index) => <div className="research-news-item" key={item.symbol + item.closed_at + index}>
        <div className="news-meta"><b>{item.symbol}</b><small>{date(item.closed_at)} · {item.reason}</small></div>
        <div className="calc-result"><span>Entry · exit · quantity</span><b>{item.entry_price} · {item.exit_price} · {item.quantity}</b></div>
        <div className="calc-result"><span>Simulated P&amp;L</span><b>{money(item.pnl)}</b></div>
      </div>)}</div> : <div className="empty-data">No completed paper trades yet.</div>}
    </div>
    <div className="panel workspace-panel"><h2>Strategy &amp; limitations</h2><p>{report?.strategy || "EMA20/EMA50 trend + RSI14 filter; ATR14 stop and 3R target."}</p><ul>{(report?.limitations || ["No market data connected.", "No live orders or broker connection.", "Futures and options are not enabled until a permitted contract/option-chain feed is available."]).map((item, i) => <li key={i}>{item}</li>)}</ul></div>
  </div>;
}
