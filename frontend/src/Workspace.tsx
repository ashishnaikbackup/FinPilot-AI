import { useMemo, useState } from "react";
import { ArrowUpRight, Calculator, ShieldCheck, Wallet, BriefcaseBusiness, ExternalLink } from "lucide-react";

type Section = "Overview" | "Markets" | "Opportunities" | "News Intelligence" | "AI Mentor" | "Portfolio" | "Learning Centre" | "Career & Income";

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
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number.isFinite(value) ? value : 0);
}

export default function Workspace({ active }: { active: Section }) {
  const [monthlyIncome, setMonthlyIncome] = useState("0");
  const [monthlyExpenses, setMonthlyExpenses] = useState("0");
  const [sip, setSip] = useState("1000");
  const [years, setYears] = useState("10");
  const [rate, setRate] = useState("10");
  const [holdings, setHoldings] = useState<{ name: string; amount: number }[]>(() => {
    try { return JSON.parse(localStorage.getItem("finpilot-holdings") || "[]"); } catch { return []; }
  });
  const [assetName, setAssetName] = useState("");
  const [assetAmount, setAssetAmount] = useState("");
  const [saved, setSaved] = useState(false);

  const monthlySurplus = Number(monthlyIncome) - Number(monthlyExpenses);
  const projected = useMemo(() => {
    const p = Math.max(0, Number(sip) || 0);
    const n = Math.max(0, Number(years) || 0) * 12;
    const r = Math.max(0, Number(rate) || 0) / 1200;
    if (!n) return 0;
    return r === 0 ? p * n : p * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
  }, [sip, years, rate]);

  function saveHolding() {
    if (!assetName.trim() || !(Number(assetAmount) > 0)) return;
    const next = [...holdings, { name: assetName.trim(), amount: Number(assetAmount) }];
    setHoldings(next);
    try { localStorage.setItem("finpilot-holdings", JSON.stringify(next)); } catch { /* storage may be disabled */ }
    setAssetName(""); setAssetAmount(""); setSaved(true);
    window.setTimeout(() => setSaved(false), 2200);
  }
  function removeHolding(index: number) {
    const next = holdings.filter((_, i) => i !== index);
    setHoldings(next);
    try { localStorage.setItem("finpilot-holdings", JSON.stringify(next)); } catch { /* storage may be disabled */ }
  }

  if (active === "Markets") return <div className="workspace-stack">
    <div className="panel workspace-panel"><div className="eyebrow">MARKET COVERAGE</div><h2>Market data, without pretending</h2><p>FinPilot currently tracks the market universe conceptually, but has no licensed live or delayed exchange quote feed. No index value is fabricated.</p>
      <div className="module-grid">{["NIFTY 50 · NSE", "SENSEX · BSE", "S&P 500 · US", "NASDAQ 100 · US", "Gold & silver", "Global rates & FX"].map(x => <div className="module-tile" key={x}><b>{x}</b><span>Quote feed not connected</span></div>)}</div>
    </div>
    <div className="panel workspace-panel"><h2>Primary market information</h2><p>Use exchange and regulator sources for official notices, market status and disclosures. Always check the document date and data entitlement.</p><div className="resource-links"><a href="https://www.nseindia.com/" target="_blank" rel="noreferrer">NSE India <ExternalLink size={13}/></a><a href="https://www.bseindia.com/" target="_blank" rel="noreferrer">BSE India <ExternalLink size={13}/></a><a href="https://www.sebi.gov.in/" target="_blank" rel="noreferrer">SEBI <ExternalLink size={13}/></a><a href="https://www.rbi.org.in/" target="_blank" rel="noreferrer">RBI <ExternalLink size={13}/></a><a href="https://www.sec.gov/edgar/search/" target="_blank" rel="noreferrer">SEC EDGAR <ExternalLink size={13}/></a></div></div>
  </div>;

  if (active === "Opportunities") return <div className="workspace-stack">
    <div className="panel workspace-panel"><div className="eyebrow">RESEARCH CHECKLIST</div><h2>Evaluate an opportunity before considering it</h2><p>These are research categories, not current recommendations or verified open offers. Each candidate needs a dated primary source and an eligibility check.</p>
      <div className="checklist-grid">{[["IPO / public issue","DRHP/RHP, price band, dates, use of proceeds, promoter holdings, valuation, risks and official registrar."],["Mutual funds / ETFs","SID/KIM, expense ratio, benchmark, tracking difference, holdings, overlap and exit load."],["Bonds / T-bills / deposits","Issuer, yield-to-maturity, duration, credit risk, liquidity, tax and reinvestment risk."],["Gold / REITs / InvITs","Instrument structure, costs, cash flows, concentration, valuation and liquidity."],["International assets","FEMA/LRS route, broker eligibility, FX costs, withholding tax, local tax and custody."],["Digital assets","Regulatory, custody, counterparty, fraud, volatility and tax risks; no trading enabled."]].map(([title,desc])=><div className="check-tile" key={title}><ShieldCheck size={17}/><div><b>{title}</b><p>{desc}</p></div></div>)}</div>
    </div>
    <div className="panel workspace-panel"><h2>Decision standard</h2><p>Every future research report should show a bull/base/bear case, evidence and source dates, valuation assumptions, fees, taxes, liquidity, downside scenarios, counterarguments and a clear “insufficient evidence” outcome when needed.</p></div>
  </div>;

  if (active === "News Intelligence") return <div className="workspace-stack">
    <div className="panel workspace-panel"><div className="eyebrow">GLOBAL EVENT MONITOR</div><h2>Discovery is not verification</h2><p>Current headlines are collected from GDELT as a discovery index. Before relying on a claim, confirm it against the original government release, regulator filing, central-bank statement or company disclosure, then seek independent corroboration.</p>
      <div className="module-grid">{[["India policy","RBI, SEBI, Ministry of Finance, MOSPI"],["Global macro","Federal Reserve, ECB, IMF, World Bank"],["Companies","NSE/BSE filings, SEC EDGAR, issuer investor relations"],["Geopolitics","Government statements, sanctions notices, official documents"]].map(([a,b])=><div className="module-tile" key={a}><b>{a}</b><span>{b}</span></div>)}</div>
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
    </div>
  </div>;

  if (active === "Learning Centre") return <div className="workspace-stack">
    <div className="panel workspace-panel"><div className="eyebrow">BEGINNER LEARNING PATH</div><h2>Learn money in the right order</h2><p>Short, practical sequence. Finish one concept and test it with a real-world example before moving on.</p><div className="lesson-list">{lessons.map(([n,title,desc])=><div className="lesson-row" key={n}><span>{n}</span><div><b>{title}</b><p>{desc}</p></div></div>)}</div></div>
    <div className="panel workspace-panel"><h2>Free trusted learning sources</h2><div className="resource-links"><a href="https://investor.sebi.gov.in/" target="_blank" rel="noreferrer">SEBI Investor <ExternalLink size={13}/></a><a href="https://www.rbi.org.in/" target="_blank" rel="noreferrer">RBI <ExternalLink size={13}/></a><a href="https://www.nism.ac.in/" target="_blank" rel="noreferrer">NISM <ExternalLink size={13}/></a><a href="https://www.investor.gov/" target="_blank" rel="noreferrer">Investor.gov <ExternalLink size={13}/></a></div></div>
  </div>;

  if (active === "Career & Income") return <div className="workspace-stack">
    <div className="panel workspace-panel"><div className="eyebrow">EARNING POWER</div><h2>Career and income research</h2><p>Official starting points for recruitment and apprenticeships. Always confirm eligibility, age cut-off, category rules, location, dates and fees in the original notification.</p><div className="career-list">{careerLinks.filter(x=>x[0]!=="Employment News").map(([name,desc,url])=><a href={url} target="_blank" rel="noreferrer" key={name}><BriefcaseBusiness size={16}/><div><b>{name}</b><span>{desc}</span></div><ArrowUpRight size={14}/></a>)}</div></div>
  </div>;

  return <div className="workspace-stack">
    <div className="panel workspace-panel"><div className="eyebrow">FINANCIAL TOOLS</div><h2>Simple planning calculators</h2><p>Illustrative calculations only. They are not forecasts, promises or investment recommendations.</p>
      <div className="calculator-grid">
        <div className="calculator-card"><div className="tool-heading"><Wallet size={17}/><b>Monthly cash-flow check</b></div><label>Monthly take-home income (₹)<input type="number" min="0" value={monthlyIncome} onChange={e=>setMonthlyIncome(e.target.value)}/></label><label>Monthly expenses (₹)<input type="number" min="0" value={monthlyExpenses} onChange={e=>setMonthlyExpenses(e.target.value)}/><div className="calc-result"><span>Monthly surplus / shortfall</span><b>{money(monthlySurplus)}</b></div></label><p className="calc-foot">A positive surplus is not automatically investable; account for debt, irregular expenses and emergency savings.</p></div>
        <div className="calculator-card"><div className="tool-heading"><Calculator size={17}/><b>SIP illustration</b></div><label>Monthly contribution (₹)<input type="number" min="0" value={sip} onChange={e=>setSip(e.target.value)}/></label><label>Years<input type="number" min="1" max="60" value={years} onChange={e=>setYears(e.target.value)}/></label><label>Assumed annual return (%)<input type="number" min="0" max="50" step="0.5" value={rate} onChange={e=>setRate(e.target.value)}/></label><div className="calc-result"><span>Illustrative future value</span><b>{money(projected)}</b></div><p className="calc-foot">Assumed constant return, monthly compounding and month-end contributions approximation; actual returns vary and can be negative. Taxes and fees excluded.</p></div>
      </div>
    </div>
  </div>;
}
