import { useEffect, useState } from "react";
import { Activity, RefreshCw, ShieldCheck } from "lucide-react";

type OptionSide = { instrument_key?: string; market_data?: { ltp?: number; volume?: number; oi?: number; bid_price?: number; ask_price?: number; bid_qty?: number; ask_qty?: number }; option_greeks?: { delta?: number; gamma?: number; theta?: number; vega?: number; iv?: number; pop?: number } };
type Strike = { expiry?: string; pcr?: number; strike_price?: number; underlying_spot_price?: number; call_options?: OptionSide; put_options?: OptionSide };
type Underlying = { underlying: string; expiry_request: string; retrieved_at: string; contracts: Strike[] };
type Payload = { status: string; provider?: string; retrieved_at?: string; underlyings?: Underlying[] };
const n=(v?:number)=>typeof v==="number"&&Number.isFinite(v)?v.toLocaleString("en-IN",{maximumFractionDigits:2}):"—";

export default function OptionsLab(){
  const [data,setData]=useState<Payload|null>(null); const [loading,setLoading]=useState(true); const [error,setError]=useState("");
  async function refresh(){try{const r=await fetch(import.meta.env.BASE_URL+"data/options-chain.json",{cache:"no-store"});if(!r.ok)throw new Error("Option-chain snapshot is not published.");setData(await r.json());setError("");}catch(e){setError(e instanceof Error?e.message:"Could not load option chain.");}finally{setLoading(false);}}
  useEffect(()=>{void refresh();const t=window.setInterval(()=>{if(document.visibilityState==="visible")void refresh();},5*60*1000);return()=>window.clearInterval(t);},[]);
  return <div className="workspace-stack">
    <div className="panel workspace-panel"><div className="panel-heading"><div><div className="eyebrow">INDIA DERIVATIVES · READ ONLY</div><h2>Options chain intelligence</h2></div><button className="subtle-button" onClick={()=>{setLoading(true);void refresh();}}><RefreshCw size={14}/> Refresh</button></div>
      <p>Displays the provider's option-chain snapshot, including market data and Greeks. This workspace does not place trades or issue F&amp;O recommendations.</p>
      <div className="calc-result"><span>Provider / last refresh</span><b>{data?.provider||"Not connected"} · {data?.retrieved_at?new Date(data.retrieved_at).toLocaleString("en-IN"):"—"}</b></div>
      {error&&<p className="calc-foot" role="status">{error}</p>}
      {loading&&!data&&<div className="empty-data">Loading option-chain snapshot…</div>}
      {(!data||data.status!=="available"||!data.underlyings?.length)&&<div className="empty-data"><ShieldCheck size={18}/> Option-chain data is unavailable. Configure an authorised provider token and confirm public display rights before publishing market data.</div>}
    </div>
    {data?.underlyings?.map(u=><div className="panel workspace-panel" key={u.underlying+u.expiry_request}>
      <div className="eyebrow">{u.underlying} · {u.expiry_request}</div><h2>{u.contracts?.[0]?.expiry||"Expiry unavailable"}</h2>
      <div className="calc-result"><span>Underlying spot · PCR</span><b>{n(u.contracts?.[0]?.underlying_spot_price)} · {n(u.contracts?.[0]?.pcr)}</b></div>
      <div className="holding-list">{u.contracts?.map(row=><div className="research-news-item" key={row.strike_price}>
        <div className="news-meta"><b>Strike {n(row.strike_price)}</b><small>Expiry {row.expiry||"—"}</small></div>
        <div className="calculator-grid">
          <div className="calculator-card"><span>CALL LTP · OI</span><b>{n(row.call_options?.market_data?.ltp)} · {n(row.call_options?.market_data?.oi)}</b><small>Δ {n(row.call_options?.option_greeks?.delta)} · IV {n(row.call_options?.option_greeks?.iv)}</small></div>
          <div className="calculator-card"><span>PUT LTP · OI</span><b>{n(row.put_options?.market_data?.ltp)} · {n(row.put_options?.market_data?.oi)}</b><small>Δ {n(row.put_options?.option_greeks?.delta)} · IV {n(row.put_options?.option_greeks?.iv)}</small></div>
        </div>
        <div className="calc-result"><span>Call bid / ask · Put bid / ask</span><b>{n(row.call_options?.market_data?.bid_price)} / {n(row.call_options?.market_data?.ask_price)} · {n(row.put_options?.market_data?.bid_price)} / {n(row.put_options?.market_data?.ask_price)}</b></div>
        <div className="calc-result"><span>Call Θ / Vega · Put Θ / Vega</span><b>{n(row.call_options?.option_greeks?.theta)} / {n(row.call_options?.option_greeks?.vega)} · {n(row.put_options?.option_greeks?.theta)} / {n(row.put_options?.option_greeks?.vega)}</b></div>
      </div>)}</div>
    </div>)}
    <div className="panel workspace-panel"><h2>Risk and data notes</h2><p><Activity size={14}/> Provider Greeks and PCR are descriptive fields, not guarantees or trade signals. Check bid/ask liquidity, lot size, expiry, exchange circulars, margin and transaction costs before any independent analysis.</p></div>
  </div>;
}
