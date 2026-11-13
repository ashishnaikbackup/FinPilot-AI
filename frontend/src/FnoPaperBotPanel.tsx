import { useEffect, useState } from "react";
import { RefreshCw, ShieldCheck } from "lucide-react";

type Signal = { underlying: string; trend: string; reason: string; rsi14?: number; candidate?: { option_type: string; expiry: string; long_symbol: string; short_symbol: string; lot_size: number; max_loss_reference: number; max_profit_reference: number; reason: string } | null; action: string };
type Position = { underlying: string; option_type: string; expiry: string; long_symbol: string; short_symbol: string; lot_size: number; entry_debit: number; last_mark: number; max_loss: number; max_profit: number };
type Trade = { underlying: string; option_type: string; long_symbol: string; short_symbol: string; lot_size: number; pnl: number; reason: string; closed_at: string };
type Report = { status: string; generated_at?: string; data?: { status?: string; provider?: string; as_of?: string; message?: string }; summary?: { cash: number; equity: number; open_positions: number; pending_orders: number; closed_trades: number; realised_pnl: number; unrealised_pnl: number }; signals?: Signal[]; positions?: Position[]; pending_orders?: { underlying: string; direction: string; option_type: string; expiry: string; long_symbol: string; short_symbol: string; lot_size: number; signal_as_of: string }[]; recent_trades?: Trade[]; limitations?: string[] };
const money=(v?:number)=>typeof v==="number"&&Number.isFinite(v)?"₹"+v.toLocaleString("en-IN",{maximumFractionDigits:2}):"—";
const date=(v?:string)=>v?new Date(v).toLocaleString("en-IN"):"—";

export default function FnoPaperBotPanel(){
  const [report,setReport]=useState<Report|null>(null);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  async function refresh(){
    try{
      const response=await fetch(import.meta.env.BASE_URL+"data/fno-paper-bot.json",{cache:"no-store"});
      if(!response.ok)throw new Error("F&O paper report is not published yet.");
      setReport(await response.json());setError("");
    }catch(err){setError(err instanceof Error?err.message:"Could not load F&O paper report.");}
    finally{setLoading(false);}
  }
  useEffect(()=>{void refresh();const timer=window.setInterval(()=>{if(document.visibilityState==="visible")void refresh();},5*60*1000);return()=>window.clearInterval(timer);},[]);
  return <div className="panel workspace-panel">
    <div className="panel-heading"><div><div className="eyebrow">AUTONOMOUS F&amp;O PAPER SIMULATION</div><h2>Defined-risk index options trader</h2></div><button className="subtle-button" type="button" onClick={()=>{setLoading(true);void refresh();}}><RefreshCw size={14}/> Refresh</button></div>
    <p>Separate ₹1,00,000 virtual account. The rules-based engine can only queue and simulate one-lot debit vertical spreads from a completed daily trend signal and a later permitted option-chain snapshot. It never places broker orders.</p>
    <div className="calc-result"><span>Engine status</span><b>{loading?"Loading…":report?.status==="available"?"Paper simulation active":"Waiting for permitted F&amp;O data"}</b></div>
    <div className="calc-result"><span>Data source / as-of</span><b>{report?.data?.provider||report?.data?.message||"No provider snapshot"} · {date(report?.data?.as_of)}</b></div>
    <div className="calc-result"><span>Last report</span><b>{date(report?.generated_at)}</b></div>
    {error&&<p className="calc-foot" role="status">{error}</p>}
    {report?.summary&&<div className="calculator-grid">
      <div className="calculator-card"><span>Virtual equity</span><b>{money(report.summary.equity)}</b></div>
      <div className="calculator-card"><span>Cash</span><b>{money(report.summary.cash)}</b></div>
      <div className="calculator-card"><span>Realised P&amp;L</span><b>{money(report.summary.realised_pnl)}</b></div>
      <div className="calculator-card"><span>Unrealised P&amp;L</span><b>{money(report.summary.unrealised_pnl)}</b></div>
    </div>}
    <div className="calc-result"><span>Open spreads · pending entries · closed trades</span><b>{report?.summary?.open_positions??0} · {report?.summary?.pending_orders??0} · {report?.summary?.closed_trades??0}</b></div>
    {!report||report.status!=="available"?<div className="empty-data"><ShieldCheck size={18}/> The F&amp;O engine stays idle until authorised option-chain, completed index bars and contract lot-size metadata are available. It will not guess lot sizes or premiums.</div>:null}
    <h3>Index trend and strategy candidates</h3>
    {report?.signals?.length?<div className="holding-list">{report.signals.map(item=><div className="research-news-item" key={item.underlying}>
      <div className="news-meta"><b>{item.underlying} · {item.trend}</b><small>{item.action} · RSI14 {item.rsi14??"—"}</small></div>
      <p className="calc-foot">{item.reason}</p>
      {item.candidate&&<div className="calc-result"><span>{item.candidate.option_type} · expiry {item.candidate.expiry}</span><b>{item.candidate.long_symbol} / {item.candidate.short_symbol}</b><small>Lot {item.candidate.lot_size} · reference max loss {money(item.candidate.max_loss_reference)} · max profit {money(item.candidate.max_profit_reference)}</small></div>}
    </div>)}</div>:<div className="empty-data">No index strategy signals yet.</div>}
    <h3>Open debit spreads</h3>
    {report?.positions?.length?<div className="holding-list">{report.positions.map((item,index)=><div className="research-news-item" key={item.underlying+item.expiry+index}>
      <div className="news-meta"><b>{item.underlying} · {item.option_type}</b><small>{item.expiry} · {item.lot_size} units</small></div>
      <div className="calc-result"><span>Long / short</span><b>{item.long_symbol} / {item.short_symbol}</b></div>
      <div className="calc-result"><span>Entry debit · current spread mark</span><b>{money(item.entry_debit)} · {money(item.last_mark)}</b></div>
      <div className="calc-result"><span>Defined max loss · max profit</span><b>{money(item.max_loss)} · {money(item.max_profit)}</b></div>
    </div>)}</div>:<div className="empty-data">No open F&amp;O paper spreads.</div>}
    <h3>Pending entries</h3>
    {report?.pending_orders?.length?<div className="holding-list">{report.pending_orders.map((item,index)=><div className="news-meta" key={item.underlying+item.signal_as_of+index}><b>{item.underlying} · {item.option_type} · {item.lot_size} units</b><small>{item.long_symbol} / {item.short_symbol} · signal {date(item.signal_as_of)}</small></div>)}</div>:<div className="empty-data">No pending F&amp;O entries.</div>}
    <h3>Recent F&amp;O paper trades</h3>
    {report?.recent_trades?.length?<div className="holding-list">{report.recent_trades.map((item,index)=><div className="news-meta" key={item.underlying+item.closed_at+index}><b>{item.underlying} · {item.option_type} · {money(item.pnl)}</b><small>{item.reason} · {date(item.closed_at)}</small></div>)}</div>:<div className="empty-data">No closed F&amp;O paper trades yet.</div>}
    <p className="calc-foot">The engine currently supports Indian index options only and long debit verticals. It excludes naked shorts, credit spreads, futures, intraday strategies, brokerage/taxes, full margin modelling and global derivatives. Provider lot sizes must be reconciled with current exchange circulars before interpreting results.</p>
  </div>;
}
