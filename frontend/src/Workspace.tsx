import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, Calculator, ShieldCheck, Wallet, BriefcaseBusiness, ExternalLink } from "lucide-react";

type Section = "Overview" | "Markets" | "Opportunities" | "News Intelligence" | "AI Mentor" | "Portfolio" | "Learning Centre" | "Career & Income";
type NewsItem = { title: string; url: string; domain?: string; seen_at?: string; source_country?: string; source?: string; source_type?: string; published_at?: string | null };
type MacroObservation = { country_code: string; country: string; indicator_code: string; indicator: string; date: string; value: number | null; unit?: string };
type ProviderStatus = { global_news?: { official_primary_source_count?: number; discovery_index_count?: number; discovery_status?: string; discovery_error?: string | null; official_feeds?: {provider:string;status:string;items?:number;error?:string}[] } };

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
  const [emergencyMonths, setEmergencyMonths] = useState("6");
  const [currentReserve, setCurrentReserve] = useState("0");
  const [sip, setSip] = useState("0");
  const [years, setYears] = useState("10");
  const [rate, setRate] = useState("10");
  const [holdings, setHoldings] = useState<{ name: string; amount: number; category: string }[]>(() => {
    try { const parsed = JSON.parse(localStorage.getItem("finpilot-holdings") || "[]"); return Array.isArray(parsed) ? parsed.filter((item: any) => item && typeof item.name === "string" && Number.isFinite(Number(item.amount)) && Number(item.amount) >= 0).map((item: any) => ({ name: item.name, amount: Number(item.amount), category: typeof item.category === "string" ? item.category : "Other" })) : []; } catch { return []; }
  });
  const [assetName, setAssetName] = useState("");
  const [assetAmount, setAssetAmount] = useState("");
  const [assetCategory, setAssetCategory] = useState("Cash & deposits");
  const [mentorStage, setMentorStage] = useState("Studying / no regular income");
  const [mentorGoal, setMentorGoal] = useState("Build earning capacity");
  const [saved, setSaved] = useState(false);
  const [candidateName, setCandidateName] = useState("");
  const [candidateType, setCandidateType] = useState("Equity / ETF / fund");
  const [candidateHorizon, setCandidateHorizon] = useState("3–5 years");
  const [candidateValuation, setCandidateValuation] = useState("Not assessed");
  const [candidateLiquidity, setCandidateLiquidity] = useState("Not assessed");
  const [candidateSource, setCandidateSource] = useState("");
  const [candidateSourceDate, setCandidateSourceDate] = useState("");
  const [candidateRisks, setCandidateRisks] = useState("");
  const [globalMacro, setGlobalMacro] = useState<MacroObservation[]>([]);
  const [globalMacroStatus, setGlobalMacroStatus] = useState<"loading" | "available" | "unavailable">("loading");
  const [macroCountry, setMacroCountry] = useState("IND");
  const [macroIndicator, setMacroIndicator] = useState("NY.GDP.MKTP.KD.ZG");
  useEffect(() => {
    let cancelled = false;
    fetch(import.meta.env.BASE_URL + "data/macro-global.json")
      .then(response => { if (!response.ok) throw new Error("Macro snapshot unavailable"); return response.json(); })
      .then(payload => { if (!cancelled) { setGlobalMacro(Array.isArray(payload.observations) ? payload.observations : []); setGlobalMacroStatus(payload.observations?.length ? "available" : "unavailable"); } })
      .catch(() => { if (!cancelled) setGlobalMacroStatus("unavailable"); });
    return () => { cancelled = true; };
  }, []);
  const researchComplete = Boolean(candidateName.trim() && isHttpsUrl(candidateSource.trim()) && candidateSourceDate && candidateValuation !== "Not assessed" && candidateLiquidity !== "Not assessed");
  const reviewGaps = [
    !candidateName.trim() ? "Name the instrument or opportunity." : "",
    !isHttpsUrl(candidateSource.trim()) ? "Add a primary-source HTTPS link (offer document, factsheet, filing or issuer disclosure)." : "",
    !candidateSourceDate ? "Record the date of the source document." : "",
    candidateValuation === "Not assessed" ? "Assess valuation using a documented method appropriate to the instrument." : "",
    candidateLiquidity === "Not assessed" ? "Check liquidity, redemption terms and exit constraints." : ""
  ].filter(Boolean);

  const macroCountryHistory = useMemo(() => globalMacro.filter(item => item.country_code === macroCountry && item.indicator_code === macroIndicator && item.value !== null).sort((a,b) => Number(a.date)-Number(b.date)), [globalMacro, macroCountry, macroIndicator]);
  const macroCountryLatest = useMemo(() => globalMacro.filter(item => item.indicator_code === macroIndicator && item.value !== null).reduce((latest, item) => { const current = latest.get(item.country_code); if (!current || Number(item.date) > Number(current.date)) latest.set(item.country_code, item); return latest; }, new Map<string, MacroObservation>()), [globalMacro, macroIndicator]);
  const holdingTotal = holdings.reduce((sum, item) => sum + item.amount, 0);
  const allocation = holdings.reduce((map, item) => { map.set(item.category, (map.get(item.category) || 0) + item.amount); return map; }, new Map<string, number>());
  const mentorGuidance = mentorStage === "Studying / no regular income" ? "Prioritise completing your course, building employable skills and securing reliable income. Keep the investing contribution at zero if you have no surplus. Learn with simulations only." : mentorStage === "Income, but high-interest debt" ? "List every debt, interest rate, minimum payment and due date. Protect essentials, avoid new borrowing and compare repayment options. Do not take market risk to try to recover debt." : mentorStage === "Income, no emergency reserve" ? "Track essential monthly costs and build a cash reserve in an accessible, low-risk place. Choose a realistic monthly amount after debt payments and irregular costs." : mentorStage === "Stable income and emergency reserve" ? "Define goals and time horizons, then learn about diversified, low-cost products. Compare fees, tax, liquidity and downside risk before making any decision." : "Review allocation, concentration, fees, taxes and liquidity. Rebalance only against a written plan, not short-term headlines.";
  const mentorGoalGuidance: Record<string, string> = { "Build earning capacity": "Choose one employable skill track, build two demonstrable projects, apply consistently to verified internships or entry roles, and track applications weekly.", "Manage debt": "Write down each balance, effective interest rate, minimum payment and due date. Prioritise expensive debt while keeping essentials current; avoid borrowing to invest.", "Build emergency savings": "Estimate essential monthly costs, choose a realistic reserve horizon and build it gradually in an accessible, low-risk account.", "Learn investing": "Start with diversification, index construction, fund costs, tracking difference, volatility, liquidity and tax. Use paper examples before risking money.", "Review existing portfolio": "Record each holding, asset class, costs, tax impact, concentration and exit restrictions. Compare the current mix with your goals before changing it." };
  const monthlySurplus = Number(monthlyIncome) - Number(monthlyExpenses);
  const emergencyTarget = Math.max(0, Number(monthlyExpenses) || 0) * Number(emergencyMonths);
  const emergencyGap = Math.max(0, emergencyTarget - Math.max(0, Number(currentReserve) || 0));
  const projected = useMemo(() => {
    const p = Math.min(100000000, Math.max(0, Number(sip) || 0));
    const n = Math.min(60, Math.max(0, Number(years) || 0)) * 12;
    const r = Math.min(50, Math.max(-50, Number(rate) || 0)) / 1200;
    if (!n) return 0;
    return r === 0 ? p * n : p * ((Math.pow(1 + r, n) - 1) / r);
  }, [sip, years, rate]);

  function saveHolding() {
    if (!assetName.trim() || !(Number(assetAmount) > 0)) return;
    const next = [...holdings, { name: assetName.trim(), amount: Number(assetAmount), category: assetCategory }];
    setHoldings(next);
    try { localStorage.setItem("finpilot-holdings", JSON.stringify(next)); } catch { /* storage may be disabled */ }
    setAssetName(""); setAssetAmount(""); setAssetCategory("Cash & deposits"); setSaved(true);
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
    <div className="panel workspace-panel"><div className="eyebrow">GLOBAL MACRO · WORLD BANK</div><h2>Compare economies and economic trends</h2><p>Annual observations for India, the United States, China, the United Kingdom, Germany and Japan. The latest year differs by country and indicator; these are not live prices or forecasts.</p>
      <div className="form-row"><label>Economic indicator<select value={macroIndicator} onChange={e=>setMacroIndicator(e.target.value)}><option value="NY.GDP.MKTP.KD.ZG">GDP growth (annual %)</option><option value="FP.CPI.TOTL.ZG">Inflation (consumer prices, annual %)</option><option value="SL.UEM.TOTL.ZS">Unemployment (% of labour force)</option><option value="NY.GDP.MKTP.CD">GDP (current US$)</option></select></label><label>Country history<select value={macroCountry} onChange={e=>setMacroCountry(e.target.value)}><option value="IND">India</option><option value="USA">United States</option><option value="CHN">China</option><option value="GBR">United Kingdom</option><option value="DEU">Germany</option><option value="JPN">Japan</option></select></label></div>
      {globalMacroStatus === "loading" ? <div className="empty-data">Loading the latest published macro snapshot…</div> : globalMacroStatus === "unavailable" ? <div className="empty-data">Global macro snapshot is unavailable. Check the next scheduled refresh.</div> : <>
        <div className="module-grid">{Array.from(macroCountryLatest.values()).sort((a,b)=>a.country.localeCompare(b.country)).map(item=><div className="module-tile" key={item.country_code}><b>{item.country}</b><span>{item.value === null ? "—" : macroIndicator === "NY.GDP.MKTP.CD" ? new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",notation:"compact",maximumFractionDigits:1}).format(item.value) : item.value.toFixed(2)+"%"} · {item.date}</span></div>)}</div>
        <h3>{macroCountryHistory[0]?.country || macroCountry} · Historical observations</h3>
        <div className="holding-list">{macroCountryHistory.slice(-12).reverse().map(item=><div className="holding-row" key={item.date}><span>{item.date}</span><b>{item.value === null ? "—" : macroIndicator === "NY.GDP.MKTP.CD" ? new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",notation:"compact",maximumFractionDigits:1}).format(item.value) : item.value.toFixed(2)+"%"}</b></div>)}</div>
      </>}
      <p className="calc-foot">Source: World Bank Indicators API · Annual series, subject to revisions and country-specific reporting delays. <a href="https://datahelpdesk.worldbank.org/knowledgebase/articles/898581-api-basic-call-structures" target="_blank" rel="noreferrer">API documentation <ExternalLink size={11}/></a></p>
    </div>
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
          <label>Source document date<input type="date" value={candidateSourceDate} onChange={e=>setCandidateSourceDate(e.target.value)}/></label>
          <label>Risks and counterarguments<textarea value={candidateRisks} onChange={e=>setCandidateRisks(e.target.value)} rows={3} placeholder="What could go wrong? What evidence would change your view?"/></label>
        </div>
        <div className="calculator-card">
          <div className="tool-heading"><ShieldCheck size={17}/><b>Review status</b></div>
          <div className="calc-result"><span>Evidence checklist</span><b>{researchComplete ? "Core fields entered" : "Incomplete"}</b></div>
          <p className="calc-foot">{researchComplete ? "The basic worksheet fields are filled. This is not an approval, risk score or investment recommendation." : "Complete these items before treating the candidate as researched."}</p>
          {reviewGaps.length > 0 && <ul className="review-gaps">{reviewGaps.map(g=><li key={g}>{g}</li>)}</ul>}
          <div className="review-summary"><b>{candidateName.trim() || "No candidate entered"}</b><span>{candidateType} · {candidateHorizon}</span><span>Valuation: {candidateValuation}</span><span>Liquidity: {candidateLiquidity}</span><span>Source date: {candidateSourceDate || "Not recorded"}</span>{isHttpsUrl(candidateSource.trim()) && <a href={candidateSource.trim()} target="_blank" rel="noreferrer">Open primary source <ExternalLink size={12}/></a>}</div>
          {candidateRisks.trim() && <div className="review-summary"><b>Your risk notes</b><span>{candidateRisks}</span></div>}
          <p className="calc-foot">Never rely on one source. Also review fees, tax, issuer quality, concentration, currency exposure, eligibility, custody, fraud risk and downside scenarios. Save the original document and its date outside this temporary worksheet.</p>
        </div>
      </div>
    </div>
    <div className="panel workspace-panel"><h2>Coverage checklist by asset class</h2><div className="checklist-grid">{[["IPO / public issue","DRHP/RHP, price band, dates, use of proceeds, promoter holdings, valuation, risks and official registrar."],["Mutual funds / ETFs","SID/KIM, expense ratio, benchmark, tracking difference, holdings, overlap and exit load."],["Bonds / T-bills / deposits","Issuer, yield-to-maturity, duration, credit risk, liquidity, tax and reinvestment risk."],["Gold / REITs / InvITs","Instrument structure, costs, cash flows, concentration, valuation and liquidity."],["International assets","FEMA/LRS route, broker eligibility, FX costs, withholding tax, local tax and custody."],["Digital assets","Regulatory, custody, counterparty, fraud, volatility and tax risks; no trading enabled."]].map(([title,desc])=><div className="check-tile" key={title}><ShieldCheck size={17}/><div><b>{title}</b><p>{desc}</p></div></div>)}</div></div>
    <div className="panel workspace-panel"><h2>Decision standard</h2><p>Every future research report should show bull/base/bear scenarios, dated evidence, valuation assumptions, fees, taxes, liquidity, downside scenarios, counterarguments and an “insufficient evidence” outcome when needed.</p></div>
  </div>;

  if (active === "News Intelligence") return <div className="workspace-stack">
    <div className="panel workspace-panel"><div className="eyebrow">GLOBAL EVENT MONITOR</div><h2>Official releases and global discovery</h2><p>Official RBI, SEBI, NSE, PIB, Federal Reserve and ECB items link to primary sources. GDELT items are a discovery index, not fact-checked. Check the original document, date and independent corroboration before relying on any claim.</p>
      <div className="module-grid"><div className="module-tile"><b>GDELT news discovery</b><span>{providerStatus?.global_news?.discovery_status || "checking"} · {providerStatus?.global_news?.discovery_index_count ?? 0} items{providerStatus?.global_news?.discovery_error ? " · "+providerStatus.global_news.discovery_error : ""}</span></div>{(providerStatus?.global_news?.official_feeds || []).map(feed=><div className="module-tile" key={feed.provider}><b>{feed.provider}</b><span>{feed.status}{feed.items !== undefined ? " · "+feed.items+" items" : ""}{feed.error ? " · "+feed.error : ""}</span></div>)}</div>
      <div className="resource-links"><a href="https://www.rbi.org.in/Scripts/BS_PressReleaseDisplay.aspx" target="_blank" rel="noreferrer">RBI press releases <ExternalLink size={13}/></a><a href="https://www.pib.gov.in/" target="_blank" rel="noreferrer">Press Information Bureau <ExternalLink size={13}/></a><a href="https://www.sebi.gov.in/rss.html" target="_blank" rel="noreferrer">SEBI RSS <ExternalLink size={13}/></a><a href="https://www.nseindia.com/static/rss-feed" target="_blank" rel="noreferrer">NSE RSS <ExternalLink size={13}/></a><a href="https://www.federalreserve.gov/newsevents/pressreleases.htm" target="_blank" rel="noreferrer">Federal Reserve <ExternalLink size={13}/></a><a href="https://www.ecb.europa.eu/press/html/index.en.html" target="_blank" rel="noreferrer">European Central Bank <ExternalLink size={13}/></a><a href="https://www.imf.org/en/News" target="_blank" rel="noreferrer">IMF News <ExternalLink size={13}/></a></div>
    </div>
    <div className="panel workspace-panel"><div className="eyebrow">LATEST SNAPSHOT</div><h2>Recent source items</h2>
      {newsItems.length ? <div className="research-news-list">{newsItems.map((item,index)=><article className="research-news-item" key={item.url || index}><div className="news-meta"><span>{item.source || item.domain || "Source"}</span><small>{item.published_at ? "Published "+item.published_at : "Indexed "+(item.seen_at || "time unavailable")}</small></div><a href={item.url} target="_blank" rel="noreferrer">{item.title}</a><p>{item.source_type === "official_primary_source" ? "Official primary-source release. Open the source document and check its date." : "Unverified discovery result. Check the original publisher and independent sources."}</p></article>)}</div> : <div className="empty-data">No news items are available in the latest public snapshot.</div>}
    </div>
  </div>;

  if (active === "AI Mentor") return <div className="workspace-stack">
    <div className="panel workspace-panel"><div className="eyebrow">CAPITAL-FIRST MENTOR</div><h2>Your first financial plan starts with stability</h2><p>This release provides a guided framework, not a connected generative-AI service. Do not enter passwords, account numbers, broker credentials or sensitive personal data.</p>
      <ol className="mentor-steps"><li><b>Know your cash flow.</b><span>Track income, fixed costs, variable costs and any debt obligations.</span></li><li><b>Protect your downside.</b><span>Build a practical emergency reserve before taking market risk.</span></li><li><b>Increase earning capacity.</b><span>Prioritise skills, internships, work experience and reliable income.</span></li><li><b>Learn products before using them.</b><span>Understand risk, liquidity, tax, fees and eligibility.</span></li><li><b>Review periodically.</b><span>Change a plan when facts, goals or circumstances change—not because of market noise.</span></li></ol>
    </div>
    <div className="panel workspace-panel"><div className="eyebrow">GUIDED PLANNER · RULES-BASED, NOT A CONNECTED AI MODEL</div><h2>Choose your current financial stage</h2><div className="form-row"><label>Where are you now?<select value={mentorStage} onChange={e=>setMentorStage(e.target.value)}><option>Studying / no regular income</option><option>Income, but high-interest debt</option><option>Income, no emergency reserve</option><option>Stable income and emergency reserve</option><option>Already investing</option></select></label><label>Main goal<select value={mentorGoal} onChange={e=>setMentorGoal(e.target.value)}><option>Build earning capacity</option><option>Manage debt</option><option>Build emergency savings</option><option>Learn investing</option><option>Review existing portfolio</option></select></label></div><div className="review-summary"><b>Your next-step checklist</b><span>{mentorGuidance}</span><span>Selected goal: {mentorGoal}</span><span>{mentorGoalGuidance[mentorGoal]}</span></div><p className="calc-foot">This is a transparent rules-based guide, not personalised financial advice or a generative AI response. It does not need an account or send your inputs anywhere.</p></div>
    <div className="panel workspace-panel"><h2>Risk guardrails</h2><div className="module-grid">{["No guaranteed-return claims","No leverage or derivatives","No automatic trading","No broker credentials stored","No unverified buy/sell signals","Capital preservation first"].map(x=><div className="module-tile" key={x}><ShieldCheck size={16}/><b>{x}</b></div>)}</div></div>
  </div>;

  if (active === "Portfolio") return <div className="workspace-stack">
    <div className="panel workspace-panel"><div className="eyebrow">DEVICE-LOCAL TRACKER</div><h2>Personal asset notes</h2><p>Entries are stored only in this browser on this device. They are not synced to an account or encrypted by FinPilot; export your own backup. Do not enter account numbers or sensitive identifiers.</p>
      <div className="form-row"><input value={assetName} onChange={e=>setAssetName(e.target.value)} placeholder="Asset label (e.g. Savings account)"/><input type="number" min="0" value={assetAmount} onChange={e=>setAssetAmount(e.target.value)} placeholder="Approx. value ₹"/><select value={assetCategory} onChange={e=>setAssetCategory(e.target.value)}><option>Cash & deposits</option><option>Equity / mutual funds</option><option>Bonds / fixed income</option><option>Gold / commodities</option><option>Property / REITs</option><option>International assets</option><option>Digital assets</option><option>Other</option></select><button onClick={saveHolding}>Add entry</button></div>{saved && <p className="success-note">Entry saved in this browser.</p>}
      <div className="holding-list">{holdings.length ? holdings.map((h,i)=><div className="holding-row" key={i}><span>{h.name} <small>· {h.category}</small></span><b>{money(h.amount)}</b><button onClick={()=>removeHolding(i)} aria-label={"Remove "+h.name}>Remove</button></div>) : <div className="empty-data">No entries yet. You can use this as a manual note tracker.</div>}</div>
      <div className="total-row"><span>Recorded total (not verified net worth)</span><b>{money(holdingTotal)}</b></div>
      {holdings.length > 0 && <div className="module-grid">{Array.from(allocation.entries()).map(([category, amount])=><div className="module-tile" key={category}><b>{category}</b><span>{money(amount)} · {holdingTotal > 0 ? (amount / holdingTotal * 100).toFixed(1) : "0.0"}% of recorded assets</span></div>)}</div>}
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
        <div className="calculator-card"><div className="tool-heading"><Wallet size={17}/><b>Monthly cash-flow check</b></div><label>Monthly take-home income (₹)<input type="number" min="0" value={monthlyIncome} onChange={e=>setMonthlyIncome(e.target.value)}/></label><label>Monthly expenses (₹)<input type="number" min="0" value={monthlyExpenses} onChange={e=>setMonthlyExpenses(e.target.value)}/></label><div className="calc-result"><span>Monthly surplus / shortfall</span><b>{money(monthlySurplus)}</b></div><label>Emergency reserve horizon<select value={emergencyMonths} onChange={e=>setEmergencyMonths(e.target.value)}><option value="3">3 months</option><option value="6">6 months</option><option value="9">9 months</option><option value="12">12 months</option></select></label><label>Existing emergency savings (₹)<input type="number" min="0" value={currentReserve} onChange={e=>setCurrentReserve(e.target.value)}/></label><div className="calc-result"><span>Illustrative reserve target</span><b>{money(emergencyTarget)}</b></div><div className="calc-result"><span>Remaining reserve gap</span><b>{money(emergencyGap)}</b></div><p className="calc-foot">A positive surplus is not automatically investable. Reserve months are a planning choice, not a universal rule; consider income stability, dependants, debt and health/insurance cover.</p></div>
        <div className="calculator-card"><div className="tool-heading"><Calculator size={17}/><b>SIP illustration</b></div><label>Monthly contribution (₹)<input type="number" min="0" value={sip} onChange={e=>setSip(e.target.value)}/></label><label>Years<input type="number" min="1" max="60" value={years} onChange={e=>setYears(e.target.value)}/></label><label>Assumed annual return (%)<input type="number" min="-50" max="50" step="0.5" value={rate} onChange={e=>setRate(e.target.value)}/></label><div className="calc-result"><span>Illustrative future value</span><b>{money(projected)}</b></div><p className="calc-foot">Assumed constant return, monthly compounding and month-end contributions; actual returns vary and can be negative. Taxes and fees excluded. Keep this at ₹0 until you have a reliable surplus and safety reserve.</p></div>
      </div>
    </div>
  </div>;
}
