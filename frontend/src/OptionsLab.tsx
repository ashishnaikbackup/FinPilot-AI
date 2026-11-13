import { useEffect, useMemo, useState } from "react";
import { Activity, Plus, RefreshCw, ShieldCheck, Trash2 } from "lucide-react";
import { calculateStrategyPayoff, expirySpotGrid, type OptionLeg } from "./lib/options";

type OptionSide = { instrument_key?: string; market_data?: { ltp?: number; volume?: number; oi?: number; bid_price?: number; ask_price?: number; bid_qty?: number; ask_qty?: number }; option_greeks?: { delta?: number; gamma?: number; theta?: number; vega?: number; iv?: number; pop?: number } };
type Strike = { expiry?: string; pcr?: number; strike_price?: number; underlying_spot_price?: number; call_options?: OptionSide; put_options?: OptionSide };
type Underlying = { underlying: string; expiry_request: string; retrieved_at: string; contracts: Strike[] };
type Payload = { status: string; provider?: string; retrieved_at?: string; underlyings?: Underlying[] };
const n=(v?:number)=>typeof v==="number"&&Number.isFinite(v)?v.toLocaleString("en-IN",{maximumFractionDigits:2}):"—";

function StrategyBuilder(){
  const [legs,setLegs]=useState<OptionLeg[]>([]);
  const [spot,setSpot]=useState("");
  const [range,setRange]=useState("15");
  const [showAll,setShowAll]=useState(false);
  const analysis=useMemo(()=>{
    if(!legs.length||!spot.trim())return {result:null as ReturnType<typeof calculateStrategyPayoff>|null,error:"Add at least one leg and enter an underlying spot."};
    try{
      const grid=expirySpotGrid(Number(spot),Number(range),20);
      const spots=[...grid,0,...legs.map(leg=>leg.strike).filter(value=>value>0)];
      return {result:calculateStrategyPayoff(legs,spots),error:""};
    }catch(error){return {result:null,error:error instanceof Error?error.message:"Unable to calculate this strategy."};}
  },[legs,spot,range]);
  function updateLeg(index:number,patch:Partial<OptionLeg>){
    setLegs(current=>current.map((leg,i)=>i===index?{...leg,...patch}:leg));
  }
  function addLeg(){
    if(legs.length>=10)return;
    setLegs(current=>[...current,{id:"leg-"+Date.now()+"-"+current.length,optionType:"call",side:"buy",strike:0,premium:0,quantity:1}]);
  }
  const currency=(value:number)=>"₹"+value.toLocaleString("en-IN",{maximumFractionDigits:2});
  return <div className="panel workspace-panel">
    <div className="panel-heading"><div><div className="eyebrow">OPTIONS STRATEGY WORKBENCH</div><h2>Multi-leg expiry payoff builder</h2></div><button className="subtle-button" type="button" onClick={addLeg} disabled={legs.length>=10}><Plus size={14}/> Add leg</button></div>
    <p>Build and compare calls, puts and spreads using manually entered premiums and quantities. This is an expiry-only scenario calculator, not a live strategy signal or margin calculator.</p>
    <div className="calculator-grid">
      <label>Underlying spot for scenario (manual)<input type="number" min="0" value={spot} onChange={e=>setSpot(e.target.value)} placeholder="Enter current/reference spot"/></label>
      <label>Scenario range (%)<input type="number" min="1" max="100" value={range} onChange={e=>setRange(e.target.value)}/></label>
    </div>
    {!legs.length&&<div className="empty-data">No strategy legs yet. Add a call or put leg to begin.</div>}
    <div className="holding-list">{legs.map((leg,index)=><div className="research-news-item" key={leg.id}>
      <div className="news-meta"><b>Leg {index+1}</b><button className="subtle-button" type="button" aria-label={"Remove leg "+(index+1)} onClick={()=>setLegs(current=>current.filter((_,i)=>i!==index))}><Trash2 size={14}/> Remove</button></div>
      <div className="calculator-grid">
        <label>Option type<select aria-label={"Leg "+(index+1)+" option type"} value={leg.optionType} onChange={e=>updateLeg(index,{optionType:e.target.value as OptionLeg["optionType"]})}><option value="call">CALL</option><option value="put">PUT</option></select></label>
        <label>Position<select aria-label={"Leg "+(index+1)+" position"} value={leg.side} onChange={e=>updateLeg(index,{side:e.target.value as OptionLeg["side"]})}><option value="buy">BUY</option><option value="sell">SELL</option></select></label>
        <label>Strike<input aria-label={"Leg "+(index+1)+" strike"} type="number" min="0" value={leg.strike||""} onChange={e=>updateLeg(index,{strike:Number(e.target.value)||0})}/></label>
        <label>Premium per unit<input aria-label={"Leg "+(index+1)+" premium"} type="number" min="0" value={leg.premium||""} onChange={e=>updateLeg(index,{premium:Number(e.target.value)||0})}/></label>
        <label>Quantity (units)<input aria-label={"Leg "+(index+1)+" quantity"} type="number" min="1" step="1" value={leg.quantity} onChange={e=>updateLeg(index,{quantity:Math.max(1,Math.floor(Number(e.target.value)||1))})}/></label>
      </div>
    </div>)}</div>
    {analysis.error&&legs.length>0&&<p className="calc-foot" role="status">{analysis.error}</p>}
    {analysis.result&&<div className="workspace-stack">
      <div className="calculator-grid">
        <div className="calculator-card"><span>Maximum profit</span><b>{analysis.result.unlimitedProfit?"Unlimited":currency(analysis.result.maxProfit||0)}</b></div>
        <div className="calculator-card"><span>Maximum loss</span><b>{analysis.result.unlimitedLoss?"Unlimited":currency(Math.abs(analysis.result.maxLoss||0))}</b></div>
        <div className="calculator-card"><span>Net premium</span><b>{analysis.result.netPremium>=0?"Credit ":"Debit "}{currency(Math.abs(analysis.result.netPremium))}</b></div>
        <div className="calculator-card"><span>Breakeven(s)</span><b>{analysis.result.breakevens.length?analysis.result.breakevens.map(currency).join(" · "):"Not in selected range"}</b></div>
      </div>
      <div className="calc-result"><span>Expiry scenario P&amp;L · indicative only</span><b>{analysis.result.points.length} spot scenarios</b></div>
      <div className="holding-list">{(showAll?analysis.result.points:analysis.result.points.filter((_,i)=>i%2===0)).map(point=><div className="news-meta" key={point.spot}><span>Expiry spot {currency(point.spot)}</span><b>{currency(point.pnl)}</b></div>)}</div>
      <button className="subtle-button" type="button" onClick={()=>setShowAll(value=>!value)}>{showAll?"Show fewer scenarios":"Show all scenarios"}</button>
    </div>}
    <p className="calc-foot">Quantity is in underlying option units, not lots. Enter the exchange-verified lot-size multiple yourself. Results exclude brokerage, taxes, margin, early exercise, volatility changes and execution slippage; unlimited risk is flagged for net short calls.</p>
  </div>;
}

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
    <StrategyBuilder/>
    <div className="panel workspace-panel"><h2>Risk and data notes</h2><p><Activity size={14}/> Provider Greeks and PCR are descriptive fields, not guarantees or trade signals. Check bid/ask liquidity, lot size, expiry, exchange circulars, margin and transaction costs before any independent analysis.</p></div>
  </div>;
}
