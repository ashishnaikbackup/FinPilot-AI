import { useMemo, useState } from "react";
import { ArrowUpRight, Calculator, ShieldCheck, Wallet, BriefcaseBusiness, ExternalLink } from "lucide-react";

type Section = "Overview" | "Markets" | "Opportunities" | "News Intelligence" | "AI Mentor" | "Portfolio" | "Learning Centre" | "Career & Income";
type NewsItem = { title: string; url: string; domain?: string; seen_at?: string; source_country?: string; source?: string; source_type?: string; published_at?: string | null };
type ProviderStatus = { global_news?: { official_primary_source_count?: number; discovery_index_count?: number; official_feeds?: {provider:string;status:string;items?:number;error?:string}[] } };

const lessons = [
  ["1", "Money foundations", "Income, expenses, cash flow, emergency funds and inflation."],
  ["2", "Banking and fixed income", "Savings accounts, FDs, T-bills, government bonds, yield and duration."],
  ["3", "Markets without the hype", "Stocks, indices, ETFs, mutual funds, diversification and volatility."],
  ["4", "Research and risk", "Financial statements, valuation, fees, taxes, liquidity and fraud checks."],
  ["5", "Global investing basics", "Currency risk, country exposure, access rules and cross-border taxes."]
];

const careerLinks = [
  ["National Career Service", "Government employment and career services", "https://www.ncs.gov.in/"],
  ["NATS", "Apprenticeship opportunities in India", "https://nats.education.gov.in/"],
  ["Employment News", "Official government recruitment and vacancy notices", "https://employmentnews.gov.in/"],
  ["Goa Government", "Official Goa government portal and department notices", "https://www.goa.gov.in/"],
  ["RBI Opportunities", "RBI recruitment and career notices", "https://opportunities.rbi.org.in/"],
  ["SEBI Careers", "SEBI recruitment notices", "https://www.sebi.gov.in/"]
];

function money(value: number) {
  return Number.isFinite(value) ? new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value) : "—";
}

function isHttpsUrl(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" && Boolean(parsed.hostname);
  } catch {
    return false;
  }
}

export default function Workspace({ active, query, newsItems = [], providerStatus }: { active: Section; query: string; newsItems?: NewsItem[]; providerStatus?: ProviderStatus | null }) {
  const [monthlyIncome, setMonthlyIncome] = useState("0");
  const [monthlyExpenses, setMonthlyExpenses] = useState("0");
  const [sip, setSip] = useState("1000");
  const [years, setYears] = useState("10");
  const [rate, setRate] = useState("10");
  const [holdings, setHoldings] = useState<{ name: string; amount: number }[]>(() => {
    try { const parsed = JSON.parse(localStorage.getItem("finpilot-holdings") || "[]"); return Array.isArray(parsed) ? parsed.filter((item: any) => item && typeof item.name === "string" && Number.isFinite(Number(item.amount)) && Number(item.amount) >= 0) : []; } catch { return []; }
  });
  const [assetName, setAssetName] = useState("");
  const [assetAmount, setAssetAmount] = useState("");
  const [saved, setSaved] = useState(false);
  const [candidateName, setCandidateName] = useState("");
  const [candidateType, setCandidateType] = useState("Equity / ETF / fund");
  const [candidateHorizon, setCandidateHorizon] = useState("3–5 years");
  const [candidateValuation, setCandidateValuation] = useState("Not assessed");
  const [candidateLiquidity, setCandidateLiquidity] = useState("Not assessed");
  const [candidateSource, setCandidateSource] = useState("");
  const [candidateRisks, setCandidateRisks] = useState("");
  const researchComplete = Boolean(candidateName.trim() && isHttpsUrl(candidateSource.trim()) && candidateValuation !== "Not assessed" && candidateLiquidity !== "Not assessed");
  const reviewGaps = [
    !candidateName.trim() ? "Name the instrument or opportunity." : "",
    !isHttpsUrl(candidateSource.trim()) ? "Add a primary-source HTTPS link (offer document, factsheet, filing or issuer disclosure)." : "",
    candidateValuation === "Not assessed" ? "Assess valuation using a documented method appropriate to the instrument." : "",
    candidateLiquidity === "Not assessed" ? "Check liquidity, redemption terms and exit constraints." : ""
  ].filter(Boolean);

  const monthlySurplus = Number(monthlyIncome) - Number(monthlyExpenses);
  const projected = useMemo(() => {
    const p = Math.min(100000000, Math.max(0, Number(sip) || 0));
    const n = Math.min(60, Math.max(0, Number(years) || 0)) * 12;
    const r = Math.min(50, Math.max(-50, Number(rate) || 0)) / 1200;
    if (!n) return 0;
    return r === 0 ? p * n : p * ((Math.pow(1 + r, n) - 1) / r);
  }, [sip, years, rate]);

  function saveHolding() {
    if (!assetName.trim() || !(Number(assetAmount) > 0)) return;
    const next = [...holdings, { name: assetName.trim(), amount: Number(assetAmount) }];
    setHoldings(next);
    try { localStorage.setItem("finpilot-holdings", JSON.stringify(next)); } catch { /* storage may be disabled */ }
    setAssetName(""); setAssetAmount(""); setSaved(true);
    window.setTimeout(() => setSaved(false), 2200);
  }
  function exportHoldings() {
    const payload = { exported_at: new Date().toISOString(), note: "User-entered local asset notes; values are not verified.", holdings };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.download = "finpilot-local-asset-notes.json"; link.click();
    URL.revokeObjectURL(url);
  }
  function clearHoldings() {
    setHoldings([]);
    try { localStorage.removeItem("finpilot-holdings"); } catch { /* storage may be disabled */ }
  }
  function removeHolding(index: number) {
    const next = holdings.filter((_, i) => i !== index);
    setHoldings(next);
    try { localStorage.setItem("finpilot-holdings", JSON.stringify(next)); } catch { /* storage may be disabled */ }
  }

  if (active === "Markets") return <div className="workspace-stack">
    <div className="panel workspace-panel"><div className="eyebrow">MARKET COVERAGE</div><h2>Market data, without pretending</h2><p>FinPilot currently tracks the market universe conceptually, but has no licensed live or delayed exchange quote feed. No index value is fabricated.</p>
      <div className="module-grid">{["NIFTY 50 · NSE", "SENSEX · BSE", "S&P 500 · US", "NASDAQ 100 · US", "Gold & silver", "Global rates & FX"].filter(x => x.toLowerCase().includes(query.toLowerCase())).map(x => <div className="module-tile" key={x}><b>{x}</b><span>Quote feed not connected</span></div>)}</div>
      {!["NIFTY 50 · NSE", "SENSEX · BSE", "S&P 500 · US", "NASDAQ 100 · US", "Gold & silver", "Global rates & FX"].some(x => x.toLowerCase().includes(query.toLowerCase())) && <div className="empty-data">No market category matches your search.</div>}
    </div>
    <div className="panel workspace-panel"><h2>Primary market information</h2><p>Use exchange and regulator sources for official notices, market status and disclosures. Always check the document date and data entitlement.</p><div className="resource-links"><a href="https://www.nseindia.com/" target="_blank" rel="noreferrer">NSE India <ExternalLink size={13}/></a><a href="https://www.bseindia.com/" target="_blank" rel="noreferrer">BSE India <ExternalLink size={13}/></a><a href="https://www.sebi.gov.in/" target="_blank" rel="noreferrer">SEBI <ExternalLink size={13}/></a><a href="https://www.rbi.org.in/" target="_blank" rel="noreferrer">RBI <ExternalLink size={13}/></a><a href="https://www.sec.gov/edgar/search/" target="_blank" rel="noreferrer">SEC EDGAR <ExternalLink size={13}/></a></div></div>
  </div>;

  if (active === "Opportunities") return <div className="workspace-stack">
    <div className="panel workspace-panel"><div className="eyebrow">RESEARCH WORKBENCH · NOT A BUY SIGNAL</div><h2>Build an evidence-backed candidate review</h2><p>Use this worksheet to organise a candidate. It does not calculate expected returns, rank assets or recommend a transaction. Enter only public instrument details; no personal financial information is needed.</p>
      <div className="calculator-grid">
        <div className="calculator-card">
          <div className="tool-heading"><ShieldCheck size={17}/><b>Candidate details</b></div>
          <label>Instrument / opportunity<input value={candidateName} onChange={e=>setCandidateName(e.target.value)} placeholder="e.g. Company / fund / bond name"/></label>
          <label>Instrument type<select value={candidateType} onChange={e=>setCandidateType(e.target.value)}><option>Equity / ETF / fund</option><option>IPO / public issue</option><option>Government security / bond</option><option>Deposit</option><option>Gold / commodity</option><option>REIT / InvIT</option><option>International asset</option><option>Digital asset</option></select></label>
          <label>Intended time horizon<select value={candidateHorizon} onChange={e=>setCandidateHorizon(e.target.value)}><option>Under 1 year</option><option>1–3 years</option><option>3–5 years</option><option>5–10 years</option><option>Over 10 years</option><option>Not decided</option></select></label>
          <label>Valuation / pricing review<select value={candidateValuation} onChange={e=>setCandidateValuation(e.target.value)}><option>Not assessed</option><option>Looks expensive — evidence required</option><option>Looks reasonable — evidence required</option><option>Looks cheap — evidence required</option><option>Not applicable / not comparable</option></select></label>
          <label>Liquidity / exit review<select value={candidateLiquidity} onChange={e=>setCandidateLiquidity(e.target.value)}><option>Not assessed</option><option>High liquidity — verify source</option><option>Limited liquidity / lock-in</option><option>Unclear redemption or exit terms</option><option>Not applicable</option></select></label>
          <label>Primary source HTTPS URL<input value={candidateSource} onChange={e=>setCandidateSource(e.target.value)} placeholder="https://…"/></label>
          <label>Risks and counterarguments<textarea value={candidateRisks} onChange={e=>setCandidateRisks(e.target.value)} rows={3} placeholder="What could go wrong? What evidence would change your view?"/></label>
        </div>
        <div className="calculator-card">
          <div className="tool-heading"><ShieldCheck size={17}/><b>Review status</b></div>
          <div className="calc-result"><span>Evidence checklist</span><b>{researchComplete ? "Core fields entered" : "Incomplete"}</b></div>
          <p className="calc-foot">{researchComplete ? "The basic worksheet fields are filled. This is not an approval, risk score or investment recommendation." : "Complete these items before treating the candidate as researched."}</p>
          {reviewGaps.length > 0 && <ul className="review-gaps">{reviewGaps.map(g=><li key={g}>{g}</li>)}</ul>}
          <div className="review-summary"><b>{candidateName.trim() || "No candidate entered"}</b><span>{candidateType} · {candidateHorizon}</span><span>Valuation: {candidateValuation}</span><span>Liquidity: {candidateLiquidity}</span>{isHttpsUrl(candidateSource.trim()) && <a href={candidateSource.trim()} target="_blank" rel="noreferrer">Open primary source <ExternalLink size={12}/></a>}</div>
          {candidateRisks.trim() && <div className="review-summary"><b>Your risk notes</b><span>{candidateRisks}</span></div>}
          <p className="calc-foot">Never rely on one source. Also review fees, tax, issuer quality, concentration, currency exposure, eligibility, custody, fraud risk and downside scenarios. Save the original document and its date outside this temporary worksheet.</p>
        </div>
      </div>
    </div>
    <div className="panel workspace-panel"><h2>Coverage checklist by asset class</h2><div className="checklist-grid">{[["IPO / public issue","DRHP/RHP, price band, dates, use of proceeds, promoter holdings, valuation, risks and official registrar."],["Mutual funds / ETFs","SID/KIM, expense ratio, benchmark, tracking difference, holdings, overlap and exit load."],["Bonds / T-bills / deposits","Issuer, yield-to-maturity, duration, credit risk, liquidity, tax and reinvestment risk."],["Gold / REITs / InvITs","Instrument structure, costs, cash flows, concentration, valuation and liquidity."],["International assets","FEMA/LRS route, broker eligibility, FX costs, withholding tax, local tax and custody."],["Digital assets","Regulatory, custody, counterparty, fraud, volatility and tax risks; no trading enabled."]].map(([title,desc])=><div className="check-tile" key={title}><ShieldCheck size={17}/><div><b>{title}</b><p>{desc}</p></div></div>)}</div></div>
    <div className="panel workspace-panel"><h2>Decision standard</h2><p>Every future research report should show bull/base/bear scenarios, dated evidence, valuation assumptions, fees, taxes, liquidity, downside scenarios, counterarguments and an “insufficient evidence” outcome when needed.</p></div>
  </div>;

  if (active === "News Intelligence") return <div className="workspace-stack">
    <div className="panel workspace-panel"><div className="eyebrow">GLOBAL EVENT MONITOR</div><h2>Official releases and global discovery</h2><p>Official RBI/PIB releases link to primary sources. GDELT items are a discovery index, not fact-checked. Check the original document, date and independent corroboration before relying on any claim.</p>
      <div className="module-grid">{(providerStatus?.global_news?.official_feeds || []).map(feed=><div className="module-tile" key={feed.provider}><b>{feed.provider}</b><span>{feed.status}{feed.items !== undefined ? " · "+feed.items+" items" : ""}{feed.error ? " · "+feed.error : ""}</span></div>)}</div>
      <div className="resource-links"><a href="https://www.rbi.org.in/Scripts/BS_PressReleaseDisplay.aspx" target="_blank" rel="noreferrer">RBI press releases <ExternalLink size={13}/></a><a href="https://www.pib.gov.in/" target="_blank" rel="noreferrer">Press Information Bureau <ExternalLink size={13}/></a><a href="https://www.federalreserve.gov/newsevents/pressreleases.htm" target="_blank" rel="noreferrer">Federal Reserve <ExternalLink size={13}/></a><a href="https://www.ecb.europa.eu/press/html/index.en.html" target="_blank" rel="noreferrer">European Central Bank <ExternalLink size={13}/></a><a href="https://www.imf.org/en/News" target="_blank" rel="noreferrer">IMF News <ExternalLink size={13}/></a></div>
    </div>
    <div className="panel workspace-panel"><div className="eyebrow">LATEST SNAPSHOT</div><h2>Recent source items</h2>
      {newsItems.length ? <div className="research-news-list">{newsItems.map((item,index)=><article className="research-news-item" key={item.url || index}><div className="news-meta"><span>{item.source || item.domain || "Source"}</span><small>{item.published_at ? "Published "+item.published_at : "Indexed "+(item.seen_at || "time unavailable")}</small></div><a href={item.url} target="_blank" rel="noreferrer">{item.title}</a><p>{item.source_type === "official_primary_source" ? "Official primary-source release. Open the source document and check its date." : "Unverified discovery result. Check the original publisher and independent sources."}</p></article>)}</div> : <div className="empty-data">No news items are available in the latest public snapshot.</div>}
    </div>
  </div>;

  if (active === "AI Mentor") return <div className="workspace-stack">
    <div className="panel workspace-panel"><div className="eyebrow">CAPITAL-FIRST MENTOR</div><h2>Your first financial plan starts with stability</h2><p>This release provides a guided framework, not a connected generative-AI service. Do not enter passwords, account numbers, broker credentials or sensitive personal data.</p>
      <ol className="mentor-steps"><li><b>Know your cash flow.</b><span>Track income, fixed costs, variable costs and any debt obligations.</span></li><li><b>Protect your downside.</b><span>Build a practical emergency reserve before taking market risk.</span></li><li><b>Increase earning capacity.</b><span>Prioritise skills, internships, work experience and reliable income.</span></li><li><b>Learn products before using them.</b><span>Understand risk, liquidity, tax, fees and eligibility.</span></li><li><b>Review periodically.</b><span>Change a plan when facts, goals or circumstances change—not because of market noise.</span></li></ol>
    </div>
    <div className="panel workspace-panel"><h2>Risk guardrails</h2><div className="module-grid">{["No guaranteed-return claims","No leverage or derivatives","No automatic trading","No broker credentials stored","No unverified buy/sell signals","Capital preservation first"].map(x=><div className="module-tile" key={x}><ShieldCheck size={16}/><b>{x}</b></div>)}</div></div>
  </div>;

  if (active === "Portfolio") return <div className="workspace-stack">
    <div className="panel workspace-panel"><div className="eyebrow">DEVICE-LOCAL TRACKER</div><h2>Personal asset notes</h2><p>Entries are stored only in this browser on this device. They are not synced, encrypted by FinPilot, or backed up. Do not enter account numbers or sensitive identifiers.</p>
      <div className="form-row"><input value={assetName} onChange={e=>setAssetName(e.target.value)} placeholder="Asset label (e.g. Savings account)"/><input type="number" min="0" value={assetAmount} onChange={e=>setAssetAmount(e.target.value)} placeholder="Approx. value ₹"/><button onClick={saveHolding}>Add entry</button></div>{saved && <p className="success-note">Entry saved in this browser.</p>}
      <div className="holding-list">{holdings.length ? holdings.map((h,i)=><div className="holding-row" key={i}><span>{h.name}</span><b>{money(h.amount)}</b><button onClick={()=>removeHolding(i)} aria-label={"Remove "+h.name}>Remove</button></div>) : <div className="empty-data">No entries yet. You can use this as a manual note tracker.</div>}</div>
      <div className="total-row"><span>Recorded total (not verified net worth)</span><b>{money(holdings.reduce((s,h)=>s+h.amount,0))}</b></div>
      <div className="resource-links"><button className="text-action" onClick={exportHoldings} disabled={!holdings.length}>Export backup JSON <ArrowUpRight size={13}/></button><button className="text-action" onClick={clearHoldings} disabled={!holdings.length}>Clear local entries</button></div>
      <p className="calc-foot">Export a backup before clearing browser data. The export is a plain JSON file; keep it private and do not upload it to a public repository.</p>
    </div>
  </div>;

  if (active === "Learning Centre") return <div className="workspace-stack">
    <div className="panel workspace-panel"><div className="eyebrow">BEGINNER LEARNING PATH</div><h2>Learn money in the right order</h2><p>Short, practical sequence. Finish one concept and test it with a real-world example before moving on.</p><div className="lesson-list">{lessons.map(([n,title,desc])=><div className="lesson-row" key={n}><span>{n}</span><div><b>{title}</b><p>{desc}</p></div></div>)}</div></div>
    <div className="panel workspace-panel"><h2>Free trusted learning sources</h2><div className="resource-links"><a href="https://investor.sebi.gov.in/" target="_blank" rel="noreferrer">SEBI Investor <ExternalLink size={13}/></a><a href="https://www.rbi.org.in/" target="_blank" rel="noreferrer">RBI <ExternalLink size={13}/></a><a href="https://www.nism.ac.in/" target="_blank" rel="noreferrer">NISM <ExternalLink size={13}/></a><a href="https://www.investor.gov/" target="_blank" rel="noreferrer">Investor.gov <ExternalLink size={13}/></a></div></div>
  </div>;

  if (active === "Career & Income") return <div className="workspace-stack">
    <div className="panel workspace-panel"><div className="eyebrow">EARNING POWER</div><h2>Career and income research</h2><p>Official starting points for recruitment and apprenticeships. Always confirm eligibility, age cut-off, category rules, location, dates and fees in the original notification.</p><div className="career-list">{careerLinks.map(([name,desc,url])=><a href={url} target="_blank" rel="noreferrer" key={name}><BriefcaseBusiness size={16}/><div><b>{name}</b><span>{desc}</span></div><ArrowUpRight size={14}/></a>)}</div></div>
  </div>;

  return <div className="workspace-stack">
    <div className="panel workspace-panel"><div className="eyebrow">FINANCIAL TOOLS</div><h2>Simple planning calculators</h2><p>Illustrative calculations only. They are not forecasts, promises or investment recommendations.</p>
      <div className="calculator-grid">
        <div className="calculator-card"><div className="tool-heading"><Wallet size={17}/><b>Monthly cash-flow check</b></div><label>Monthly take-home income (₹)<input type="number" min="0" value={monthlyIncome} onChange={e=>setMonthlyIncome(e.target.value)}/></label><label>Monthly expenses (₹)<input type="number" min="0" value={monthlyExpenses} onChange={e=>setMonthlyExpenses(e.target.value)}/><div className="calc-result"><span>Monthly surplus / shortfall</span><b>{money(monthlySurplus)}</b></div></label><p className="calc-foot">A positive surplus is not automatically investable; account for debt, irregular expenses and emergency savings.</p></div>
        <div className="calculator-card"><div className="tool-heading"><Calculator size={17}/><b>SIP illustration</b></div><label>Monthly contribution (₹)<input type="number" min="0" value={sip} onChange={e=>setSip(e.target.value)}/></label><label>Years<input type="number" min="1" max="60" value={years} onChange={e=>setYears(e.target.value)}/></label><label>Assumed annual return (%)<input type="number" min="-50" max="50" step="0.5" value={rate} onChange={e=>setRate(e.target.value)}/></label><div className="calc-result"><span>Illustrative future value</span><b>{money(projected)}</b></div><p className="calc-foot">Assumed constant return, monthly compounding and month-end contributions; actual returns vary and can be negative. Taxes and fees excluded.</p></div>
      </div>
    </div>
  </div>;
}
