import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpRight, Calculator, ShieldCheck, Wallet, BriefcaseBusiness, ExternalLink } from "lucide-react";

type Section = "Overview" | "Markets" | "Opportunities" | "News Intelligence" | "AI Mentor" | "Portfolio" | "Learning Centre" | "Career & Income";
type NewsItem = { title: string; url: string; domain?: string; seen_at?: string; source_country?: string; source?: string; source_type?: string; published_at?: string | null };
type MacroObservation = { country_code: string; country: string; indicator_code: string; indicator: string; date: string; value: number | null; unit?: string };
type ResearchCase = { id: number; name: string; type: string; horizon: string; valuation: string; liquidity: string; source: string; sourceDate: string; bull: string; base: string; bear: string; costs: string; risks: string; savedAt: string };
type ProviderStatus = { global_news?: { status?: string; error?: string | null; official_primary_source_count?: number; discovery_index_count?: number; discovery_status?: string; discovery_error?: string | null; official_feeds?: {provider:string;status:string;items?:number;error?:string}[] } };

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
  ["SEBI Careers", "SEBI recruitment notices", "https://www.sebi.gov.in/"],
  ["IBPS", "Public-sector bank recruitment and examinations", "https://www.ibps.in/"],
  ["Railway Recruitment Boards", "Official railway recruitment notices and updates", "https://www.rrbcdg.gov.in/"],
  ["Staff Selection Commission", "Central government recruitment examinations", "https://ssc.gov.in/"],
  ["Goa Public Service Commission", "Goa state government officer recruitment", "https://gpsc.goa.gov.in/"],
  ["UPSC", "Central civil services and specialist recruitment", "https://upsc.gov.in/"]
];

function money(value: number) {
  return Number.isFinite(value) ? new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value) : "—";
}

const widgetScriptPromises = new Map<string, Promise<void>>();

function loadTradingViewWidget(src: string, tag: string) {
  if (!widgetScriptPromises.has(src)) {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
    const promise = new Promise<void>((resolve, reject) => {
      if (customElements.get(tag) || existing?.dataset.loaded === "true") {
        resolve();
        return;
      }
      const script = existing || document.createElement("script");
      script.type = "module";
      script.src = src;
      script.addEventListener("load", () => { script.dataset.loaded = "true"; resolve(); }, { once: true });
      script.addEventListener("error", () => reject(new Error("TradingView widget could not be loaded.")), { once: true });
      if (!existing) document.head.appendChild(script);
    });
    widgetScriptPromises.set(src, promise);
  }
  return widgetScriptPromises.get(src)!;
}

function TradingViewEmbed({ tag, script, attributes, height = 420, label }: {
  tag: string;
  script: string;
  attributes: Record<string, string>;
  height?: number;
  label: string;
}) {
  const host = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const attributeKey = JSON.stringify(attributes);
  useEffect(() => {
    let cancelled = false;
    async function mount() {
      try {
        if (!customElements.get(tag)) {
          await loadTradingViewWidget(script, tag);
          await customElements.whenDefined(tag);
        }
        if (cancelled || !host.current) return;
        const element = document.createElement(tag);
        Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
        element.style.display = "block";
        element.style.width = "100%";
        element.style.height = `${height}px`;
        host.current.replaceChildren(element);
      } catch {
        if (!cancelled) setFailed(true);
      }
    }
    mount();
    return () => {
      cancelled = true;
      if (host.current) host.current.replaceChildren();
    };
  }, [tag, script, attributeKey, height]);
  return <div className="tv-widget-shell">
    <div ref={host} className="tv-widget-host" style={{ minHeight: height }} aria-label={label} aria-live="polite"><div className="tv-widget-loading">Loading {label}…</div></div>
    {failed && <div className="tv-widget-fallback">The market widget could not load. Check your connection or <a href="https://www.tradingview.com/widget/" target="_blank" rel="noreferrer">open TradingView widgets</a>.</div>}
  </div>;
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
  const [goalName, setGoalName] = useState("Education / major purchase");
  const [goalTarget, setGoalTarget] = useState("500000");
  const [goalCurrent, setGoalCurrent] = useState("0");
  const [goalYears, setGoalYears] = useState("5");
  const [goalInflation, setGoalInflation] = useState("5");
  const [goalReturn, setGoalReturn] = useState("0");
  const [debtBalance, setDebtBalance] = useState("100000");
  const [debtRate, setDebtRate] = useState("14");
  const [debtPayment, setDebtPayment] = useState("5000");
  const [holdings, setHoldings] = useState<{ name: string; amount: number; category: string }[]>(() => {
    try { const parsed = JSON.parse(localStorage.getItem("finpilot-holdings") || "[]"); return Array.isArray(parsed) ? parsed.filter((item: any) => item && typeof item.name === "string" && Number.isFinite(Number(item.amount)) && Number(item.amount) >= 0).map((item: any) => ({ name: item.name, amount: Number(item.amount), category: typeof item.category === "string" ? item.category : "Other" })) : []; } catch { return []; }
  });
  const [assetName, setAssetName] = useState("");
  const [assetAmount, setAssetAmount] = useState("");
  const [assetCategory, setAssetCategory] = useState("Cash & deposits");
  const [mentorStage, setMentorStage] = useState("Studying / no regular income");
  const [mentorGoal, setMentorGoal] = useState("Build earning capacity");
  const [mentorMessages, setMentorMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [mentorDraft, setMentorDraft] = useState("");
  const [saved, setSaved] = useState(false);
  const [importMessage, setImportMessage] = useState("");
  const [candidateName, setCandidateName] = useState("");
  const [candidateType, setCandidateType] = useState("Equity / ETF / fund");
  const [candidateHorizon, setCandidateHorizon] = useState("3–5 years");
  const [candidateValuation, setCandidateValuation] = useState("Not assessed");
  const [candidateLiquidity, setCandidateLiquidity] = useState("Not assessed");
  const [candidateSource, setCandidateSource] = useState("");
  const [candidateSourceDate, setCandidateSourceDate] = useState("");
  const [candidateRisks, setCandidateRisks] = useState("");
  const [candidateBull, setCandidateBull] = useState("");
  const [candidateBase, setCandidateBase] = useState("");
  const [candidateBear, setCandidateBear] = useState("");
  const [candidateCosts, setCandidateCosts] = useState("");
  const [researchCases, setResearchCases] = useState<ResearchCase[]>(() => { try { const value = JSON.parse(localStorage.getItem("finpilot-research-cases") || "[]"); return Array.isArray(value) ? value.filter((item: any) => item && typeof item.name === "string" && typeof item.source === "string") : []; } catch { return []; } });
  const [researchSaved, setResearchSaved] = useState(false);
  const [globalMacro, setGlobalMacro] = useState<MacroObservation[]>([]);
  const [globalMacroStatus, setGlobalMacroStatus] = useState<"loading" | "available" | "stale" | "unavailable">("loading");
  const [globalMacroFreshness, setGlobalMacroFreshness] = useState("not yet loaded");
  const [globalMacroRetrievedAt, setGlobalMacroRetrievedAt] = useState("");
  const [macroCountry, setMacroCountry] = useState("IND");
  const [macroIndicator, setMacroIndicator] = useState("NY.GDP.MKTP.KD.ZG");
  const [chartSymbol, setChartSymbol] = useState("NSE:RELIANCE");
  const [chartSymbolDraft, setChartSymbolDraft] = useState("NSE:RELIANCE");
  const [chartInterval, setChartInterval] = useState("1D");
  const [chartInputError, setChartInputError] = useState("");
  useEffect(() => {
    let cancelled = false;
    fetch(import.meta.env.BASE_URL + "data/macro-global.json")
      .then(response => { if (!response.ok) throw new Error("Macro snapshot unavailable"); return response.json(); })
      .then(payload => { if (!cancelled) { setGlobalMacro(Array.isArray(payload.observations) ? payload.observations : []); setGlobalMacroRetrievedAt(typeof payload.retrieved_at === "string" ? payload.retrieved_at : ""); setGlobalMacroFreshness(typeof payload.freshness === "string" ? payload.freshness : "unknown"); setGlobalMacroStatus(payload.observations?.length ? (payload.freshness === "stale_last_known_good" ? "stale" : "available") : "unavailable"); } })
      .catch(() => { if (!cancelled) setGlobalMacroStatus("unavailable"); });
    return () => { cancelled = true; };
  }, []);
  const researchComplete = Boolean(candidateName.trim() && isHttpsUrl(candidateSource.trim()) && candidateSourceDate && candidateValuation !== "Not assessed" && candidateLiquidity !== "Not assessed" && candidateBull.trim() && candidateBase.trim() && candidateBear.trim() && candidateCosts.trim() && candidateRisks.trim());
  const reviewGaps = [
    !candidateName.trim() ? "Name the instrument or opportunity." : "",
    !isHttpsUrl(candidateSource.trim()) ? "Add an HTTPS link to the original offer document, factsheet, filing or issuer disclosure." : "",
    !candidateSourceDate ? "Record the date of the source document." : "",
    candidateValuation === "Not assessed" ? "Assess valuation using a documented method appropriate to the instrument." : "",
    candidateLiquidity === "Not assessed" ? "Check liquidity, redemption terms and exit constraints." : "",
    !candidateBull.trim() ? "Write a bull case with evidence and assumptions." : "",
    !candidateBase.trim() ? "Write a base case with evidence and assumptions." : "",
    !candidateBear.trim() ? "Write a bear case and downside risks." : "",
    !candidateCosts.trim() ? "Record fees, taxes and other costs to verify." : "",
    !candidateRisks.trim() ? "Record independent counterarguments and the evidence that could invalidate your view." : ""
  ].filter(Boolean);

  const ipoItems = useMemo(() => newsItems.filter(item => item.source_type === "official_primary_source" && /(ipo|public issue|offer document|drhp|rhp|issue summary|initial public)/i.test(item.title + " " + (item.source || ""))).slice(0, 10), [newsItems]);
  const macroCountryHistory = useMemo(() => globalMacro.filter(item => item.country_code === macroCountry && item.indicator_code === macroIndicator && item.value !== null).sort((a,b) => Number(a.date)-Number(b.date)), [globalMacro, macroCountry, macroIndicator]);
  const macroCountryLatest = useMemo(() => globalMacro.filter(item => item.indicator_code === macroIndicator && item.value !== null).reduce((latest, item) => { const current = latest.get(item.country_code); if (!current || Number(item.date) > Number(current.date)) latest.set(item.country_code, item); return latest; }, new Map<string, MacroObservation>()), [globalMacro, macroIndicator]);
  const holdingTotal = holdings.reduce((sum, item) => sum + item.amount, 0);
  const topHoldingShare = holdingTotal > 0 ? Math.max(...holdings.map(item => item.amount)) / holdingTotal * 100 : 0;
  const categoryShares = Array.from(holdings.reduce((map, item) => map.set(item.category, (map.get(item.category) || 0) + item.amount), new Map<string, number>()).entries()).map(([category, amount]) => ({ category, amount, share: holdingTotal > 0 ? amount / holdingTotal * 100 : 0 })).sort((a,b) => b.share-a.share);
  const goalProjection = useMemo(() => {
    const target = Math.max(0, Number(goalTarget) || 0);
    const current = Math.max(0, Number(goalCurrent) || 0);
    const months = Math.min(600, Math.max(0, Number(goalYears) || 0) * 12);
    const inflation = Math.min(30, Math.max(0, Number(goalInflation) || 0)) / 100;
    const annualReturn = Math.min(30, Math.max(0, Number(goalReturn) || 0)) / 100;
    const futureTarget = target * Math.pow(1 + inflation, months / 12);
    const gapAtZero = Math.max(0, futureTarget - current);
    const zeroReturnMonthly = months > 0 ? gapAtZero / months : 0;
    const monthlyRate = Math.pow(1 + annualReturn, 1 / 12) - 1;
    const futureCurrent = current * Math.pow(1 + monthlyRate, months);
    const monthlyAtAssumption = months > 0 ? (monthlyRate === 0 ? Math.max(0, futureTarget - futureCurrent) / months : Math.max(0, futureTarget - futureCurrent) * monthlyRate / (Math.pow(1 + monthlyRate, months) - 1)) : 0;
    return { futureTarget, zeroReturnMonthly, monthlyAtAssumption, months };
  }, [goalTarget, goalCurrent, goalYears, goalInflation, goalReturn]);
  const debtProjection = useMemo(() => {
    let balance = Math.max(0, Number(debtBalance) || 0);
    const payment = Math.max(0, Number(debtPayment) || 0);
    const monthlyRate = Math.min(100, Math.max(0, Number(debtRate) || 0)) / 1200;
    if (!balance) return { months: 0, interest: 0, totalPaid: 0, status: "No outstanding balance" };
    if (!payment) return { months: 0, interest: 0, totalPaid: 0, status: "Enter a monthly payment" };
    if (monthlyRate > 0 && payment <= balance * monthlyRate) return { months: 0, interest: 0, totalPaid: 0, status: "Payment does not cover monthly interest" };
    let months = 0, interest = 0, totalPaid = 0;
    while (balance > 0.01 && months < 1200) {
      const charge = balance * monthlyRate;
      const paid = Math.min(balance + charge, payment);
      interest += charge;
      totalPaid += paid;
      balance = Math.max(0, balance + charge - paid);
      months += 1;
    }
    return { months, interest, totalPaid, status: months >= 1200 ? "More than 100 years" : "Illustrative payoff estimate" };
  }, [debtBalance, debtRate, debtPayment]);
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

  function sendMentorMessage() {
    const content = mentorDraft.trim();
    if (!content) return;
    const q = content.toLowerCase();
    let answer = "I can help with cash flow, emergency savings, debt, investing basics, Indian and global assets, IPO checks, risk, scams, taxes and career planning. Try asking about one of those topics. This is a rules-based learning guide, not a generative AI model or personalised investment advice.";
    if (/\b(no money|zero|0|student|no income|unemployed|starting from|start investing)\b/.test(q)) answer = "If you currently have no investable surplus, do not force an SIP or borrow to invest. First focus on completing your studies, building employable skills, finding reliable income, tracking essential expenses and avoiding high-interest debt. Start an emergency reserve when income begins. You can learn markets with paper examples without risking money.";
    else if (/\b(emergency|reserve|savings|cash buffer)\b/.test(q)) answer = "An emergency reserve is money kept accessible for essential expenses and unexpected events. Estimate essential monthly costs, choose a realistic target (often several months, adjusted to job stability and family responsibilities), and build it gradually in an appropriate low-risk, liquid account. Check deposit insurance, access rules and fees; do not put emergency money into volatile assets.";
    else if (/\b(debt|loan|credit card|emi|borrow)\b/.test(q)) answer = "List each debt, outstanding balance, effective interest rate, minimum payment and due date. Keep essential bills current and prioritise expensive debt. Avoid taking new loans to invest or trying to recover losses through trading. Compare prepayment charges and maintain a small cash buffer.";
    else if (/\b(sip|mutual fund|index fund|etf)\b/.test(q)) answer = "A SIP is a way to invest a fixed amount periodically; it is not an asset or a return guarantee. Before choosing a mutual fund or ETF, compare its benchmark, expense ratio, tracking difference, portfolio holdings, concentration, liquidity, exit load, tax treatment and risk. Equity funds can fall substantially. If you have no surplus or emergency reserve, keep the contribution at ₹0 for now.";
    else if (/\b(fd|fixed deposit|t-bill|treasury bill|bond|g-sec|government securit)\b/.test(q)) answer = "An FD is a bank deposit with a stated interest rate and tenure, subject to the bank's terms and deposit-insurance limits. A T-bill is a short-term government security issued at a discount and redeemed at face value; longer government bonds can fluctuate in market price when yields change. Compare yield to maturity, tax, minimum investment, liquidity, reinvestment risk and early-exit rules. Verify current terms on official RBI/bank sources.";
    else if (/\b(stock|share|equity|nifty|sensex|valuation)\b/.test(q)) answer = "A share represents ownership in a company. Research business quality, revenue and cash-flow durability, debt, governance, competitive position, valuation assumptions, sector risks and liquidity. Compare bull/base/bear scenarios and identify what evidence would disprove your thesis. A good company can still be a poor investment at an excessive price. This site does not currently provide licensed live quotes or buy/sell signals.";
    else if (/\b(gold|silver|commodity)\b/.test(q)) answer = "Gold and silver can diversify some portfolios but prices can be volatile and they do not generate business cash flow. Compare the instrument (physical metal, ETF, fund or other route), spreads, making/storage costs, expense ratio, tracking difference, liquidity, tax and regulatory eligibility. Avoid treating recent price rises as a guarantee.";
    else if (/\b(ipo|drhp|rhp|public issue)\b/.test(q)) answer = "For an IPO, read the latest DRHP/RHP and exchange/issuer notices. Check the business model, audited financials, debt, promoter and related-party disclosures, litigation, use of proceeds, dilution, valuation versus listed peers, anchor/institutional demand where disclosed, lock-ins and risk factors. Compare a bull/base/bear case. Subscription demand or grey-market premiums are not proof of value; verify dates and details from official sources.";
    else if (/\b(crypto|bitcoin|digital asset)\b/.test(q)) answer = "Crypto assets can be extremely volatile and may involve custody, fraud, liquidity, platform, regulatory and tax risks. Do not borrow, use leverage or risk emergency money. Verify current Indian tax and legal treatment from official sources and understand that exchange availability does not equal regulatory protection. FinPilot does not connect to wallets or execute trades.";
    else if (/\b(reit|invit|real estate|property)\b/.test(q)) answer = "Property and listed REITs/InvITs have different liquidity, leverage, valuation, cash-flow and concentration risks. For direct property, include stamp duty, registration, maintenance, vacancy, financing, title and exit costs. For listed trusts, review portfolio quality, occupancy, debt, distribution history, fees and market-price volatility. Do not compare headline rental yield with a risk-free deposit rate without adjusting for costs and risk.";
    else if (/\b(global|international|us stock|foreign|overseas|dollar)\b/.test(q)) answer = "Cross-border investing adds currency, market-hours, custody, platform, tax, remittance and regulatory risks. For an India resident, verify current RBI/FEMA/LRS rules, tax reporting, permitted routes, fees and provider eligibility before transferring money. Use official RBI and tax sources; do not assume a foreign app or product is automatically accessible.";
    else if (/\b(tax|capital gain|itr|income tax)\b/.test(q)) answer = "Tax depends on instrument type, holding period, transaction date, residency and current law. Keep contract notes, statements, dividend/interest records and expense details. Verify current rules on the Income Tax Department portal or consult a qualified tax professional. FinPilot's educational material is not tax advice.";
    else if (/\b(job|career|internship|income|salary|goa|government|railway|bank exam)\b/.test(q)) answer = "Treat income growth as a core part of financial planning. Build demonstrable skills and projects, prepare a focused CV, apply consistently and verify vacancies, eligibility, age limits, fees and deadlines on official employer or recruitment portals. For Goa and India-wide roles, use NCS, NATS, Employment News, GPSC, Goa Government, RBI, SEBI, IBPS, RRB, SSC and UPSC official sites. Never pay an unofficial agent for a job.";
    else if (/\b(scam|fraud|telegram|guaranteed|double money|tip|signal)\b/.test(q)) answer = "Red flags include guaranteed returns, urgency, secret strategies, unregistered advisers, pressure to move chats to Telegram/WhatsApp, requests for OTPs or remote access, and payments to personal accounts. Verify intermediaries and warnings on SEBI/RBI official sites. Never share passwords, OTPs, card details, private keys or screen access.";
    else if (/\b(risk|diversif|portfolio|allocation|loss|crash)\b/.test(q)) answer = "Review risk at the whole-portfolio level: asset allocation, concentration, volatility, drawdowns, liquidity needs, time horizon, currency exposure, fees and taxes. Diversification can reduce some company-specific risk but cannot eliminate market losses. Write down a rebalancing rule in advance and avoid reacting to headlines.";
    const reply = { role: "assistant" as const, content: answer };
    setMentorMessages(items => [...items, { role: "user" as const, content }, reply].slice(-12));
    setMentorDraft("");
  }

  function saveResearchCase() {
    if (!researchComplete) return;
    const item: ResearchCase = {
      id: Date.now(), name: candidateName.trim(), type: candidateType, horizon: candidateHorizon,
      valuation: candidateValuation, liquidity: candidateLiquidity, source: candidateSource.trim(),
      sourceDate: candidateSourceDate, bull: candidateBull.trim(), base: candidateBase.trim(),
      bear: candidateBear.trim(), costs: candidateCosts.trim(), risks: candidateRisks.trim(),
      savedAt: new Date().toISOString()
    };
    const next = [item, ...researchCases].slice(0, 50);
    setResearchCases(next);
    try { localStorage.setItem("finpilot-research-cases", JSON.stringify(next)); setResearchSaved(true); } catch { setResearchSaved(false); }
  }
  function exportResearchCases() {
    const payload = { exported_at: new Date().toISOString(), note: "User-created research notes. Not investment advice or recommendations.", cases: researchCases };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.download = "finpilot-research-notes.json"; link.click();
    URL.revokeObjectURL(url);
  }
  function removeResearchCase(id: number) {
    const next = researchCases.filter(item => item.id !== id);
    setResearchCases(next);
    try { localStorage.setItem("finpilot-research-cases", JSON.stringify(next)); } catch { /* storage may be disabled */ }
  }

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
  async function importHoldingsFile(file?: File) {
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      const incoming = Array.isArray(parsed) ? parsed : parsed?.holdings;
      if (!Array.isArray(incoming)) throw new Error("This file does not contain an asset backup.");
      const cleaned = incoming.filter((item: any) => item && typeof item.name === "string" && item.name.trim() && Number.isFinite(Number(item.amount)) && Number(item.amount) > 0 && typeof item.category === "string").map((item: any) => ({ name: item.name.trim().slice(0,100), amount: Number(item.amount), category: item.category.slice(0,60) }));
      if (!cleaned.length) throw new Error("No valid asset entries were found.");
      const next = [...holdings, ...cleaned].slice(0,200);
      setHoldings(next);
      localStorage.setItem("finpilot-holdings", JSON.stringify(next));
      setImportMessage("Imported " + Math.max(0, Math.min(cleaned.length, 200 - holdings.length)) + " valid entries into this browser.");
    } catch (error) {
      setImportMessage(error instanceof Error ? error.message : "Could not import this file.");
    }
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
    <div className="panel workspace-panel market-live-panel">
      <div className="eyebrow">LIVE MARKET VIEW · EXTERNAL DATA WIDGET</div>
      <h2>Explore stocks, indices and assets</h2>
      <p>Interactive charts are embedded from TradingView. Select a market symbol, change the timeframe, and inspect the chart. Coverage and quote speed depend on the exchange and the provider's data entitlement.</p>
      <div className="market-symbol-row">
        {[
          ["NIFTY 50","NSE:NIFTY"],["SENSEX","BSE:SENSEX"],["RELIANCE","NSE:RELIANCE"],["TCS","NSE:TCS"],["INFOSYS","NSE:INFY"],["S&P 500","SP:SPX"],["NASDAQ 100","NASDAQ:NDX"],["GOLD","TVC:GOLD"],["BITCOIN","BINANCE:BTCUSDT"]
        ].filter(([label,symbol])=>(label+" "+symbol).toLowerCase().includes(query.toLowerCase())).map(([label,symbol])=><button key={symbol} className={chartSymbol===symbol?"symbol-chip selected":"symbol-chip"} onClick={()=>{setChartSymbol(symbol);setChartSymbolDraft(symbol);setChartInputError("");}}>{label}</button>)}
      </div>
      <div className="market-chart-controls">
        <label>Symbol (EXCHANGE:TICKER)<input value={chartSymbolDraft} onChange={e=>setChartSymbolDraft(e.target.value.toUpperCase())} placeholder="NSE:RELIANCE" /></label>
        <label>Timeframe<select value={chartInterval} onChange={e=>setChartInterval(e.target.value)}><option value="1">1 minute</option><option value="5">5 minutes</option><option value="15">15 minutes</option><option value="60">1 hour</option><option value="240">4 hours</option><option value="1D">1 day</option><option value="1W">1 week</option><option value="1M">1 month</option></select></label>
        <button className="primary-button" onClick={()=>{const value=chartSymbolDraft.trim().toUpperCase();if(!/^[A-Z0-9._-]+:[A-Z0-9._-]+$/.test(value)){setChartInputError("Use EXCHANGE:TICKER format, for example NSE:RELIANCE.");return;}setChartSymbol(value);setChartInputError("");}}>Load chart <ArrowUpRight size={14}/></button>
      </div>
      {chartInputError && <p className="error-note">{chartInputError}</p>}
      <TradingViewEmbed tag="tv-advanced-chart" script="https://widgets.tradingview-widget.com/w/en/tv-advanced-chart.js" attributes={{symbol:chartSymbol,interval:chartInterval,theme:"dark",timezone:"Asia/Kolkata","allow-symbol-change":"true",autosize:"true"}} height={540} label={"TradingView chart for "+chartSymbol}/>
      <p className="calc-foot">Source: TradingView embedded chart. Stock widgets may be delayed; forex and crypto widgets may be real-time. Data levels vary by market and exchange. A TradingView subscription does not upgrade exchange data rights; some real-time exchange data requires a separate exchange entitlement. FinPilot does not copy these quotes into its own database. <a href="https://www.tradingview.com/widget/" target="_blank" rel="noreferrer">Widget data and market coverage details <ExternalLink size={11}/></a></p>
    </div>
    <div className="panel workspace-panel">
      <div className="eyebrow">MARKET BREADTH</div><h2>Global stock market heatmap</h2>
      <p>Explore market performance by sector and market capitalisation. This view is provided and refreshed by TradingView; it is not an independently verified FinPilot quote feed.</p>
      <TradingViewEmbed tag="tv-heatmap" script="https://widgets.tradingview-widget.com/w/en/tv-heatmap.js" attributes={{"heatmap-type":"stock","data-source":"SPX500",grouping:"sector","block-size":"market_cap_basic","block-color":"change"}} height={440} label="Global stock market heatmap"/>
      <div className="resource-links"><a href="https://www.tradingview.com/markets/stocks-india/market-movers-all-stocks/" target="_blank" rel="noreferrer">India stock screener <ExternalLink size={13}/></a><a href="https://www.tradingview.com/markets/stocks-usa/market-movers-all-stocks/" target="_blank" rel="noreferrer">US stock screener <ExternalLink size={13}/></a><a href="https://www.tradingview.com/markets/cryptocurrencies/prices-all/" target="_blank" rel="noreferrer">Crypto market <ExternalLink size={13}/></a><a href="https://www.tradingview.com/markets/etfs/funds/" target="_blank" rel="noreferrer">ETF market <ExternalLink size={13}/></a></div>
    </div>
    <div className="panel workspace-panel">
      <div className="eyebrow">DIGITAL ASSETS · HIGH VOLATILITY</div><h2>Crypto market heatmap</h2>
      <p>Market-cap and daily-change view for supported crypto assets. This is market information, not a recommendation or a prompt to trade.</p>
      <TradingViewEmbed tag="tv-heatmap" script="https://widgets.tradingview-widget.com/w/en/tv-heatmap.js" attributes={{"heatmap-type":"crypto-coins","data-source":"Crypto","block-size":"market_cap_calc","block-color":"24h_close_change|5"}} height={420} label="Cryptocurrency market heatmap"/>
    </div>
    <div className="panel workspace-panel">
      <div className="eyebrow">ECONOMIC EVENTS</div><h2>Global economic calendar</h2>
      <p>Upcoming macro releases and central-bank events can move markets. Check the actual release, consensus, revisions and source before drawing conclusions.</p>
      <TradingViewEmbed tag="tv-economic-calendar" script="https://widgets.tradingview-widget.com/w/en/tv-economic-calendar.js" attributes={{}} height={440} label="Global economic calendar"/>
    </div>
    <div className="panel workspace-panel"><h2>Primary market information</h2><p>Use exchange and regulator sources for official notices, market status and disclosures. Always check the document date and data entitlement.</p><div className="resource-links"><a href="https://www.nseindia.com/" target="_blank" rel="noreferrer">NSE India <ExternalLink size={13}/></a><a href="https://www.bseindia.com/" target="_blank" rel="noreferrer">BSE India <ExternalLink size={13}/></a><a href="https://www.sebi.gov.in/" target="_blank" rel="noreferrer">SEBI <ExternalLink size={13}/></a><a href="https://www.rbi.org.in/" target="_blank" rel="noreferrer">RBI <ExternalLink size={13}/></a><a href="https://www.sec.gov/edgar/search/" target="_blank" rel="noreferrer">SEC EDGAR <ExternalLink size={13}/></a></div></div>
    <div className="panel workspace-panel"><div className="eyebrow">GLOBAL MACRO · WORLD BANK</div><h2>Compare economies and economic trends</h2><p>Annual observations for India, the United States, China, the United Kingdom, Germany and Japan. The latest year differs by country and indicator; these are not live prices or forecasts.</p><p className="calc-foot">Snapshot freshness: {globalMacroFreshness}. Retrieved: {globalMacroRetrievedAt ? new Date(globalMacroRetrievedAt).toLocaleString() + " (device local time)" : "timestamp unavailable"}.</p>
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
    <div className="panel workspace-panel"><div className="eyebrow">OFFICIAL ISSUE NOTICE DISCOVERY</div><h2>IPO and public-issue watch</h2><p>Filtered from official SEBI, NSE and BSE source headlines when available. This is a notice-discovery queue, not a complete IPO calendar or an application recommendation. Verify issue dates, price band, DRHP/RHP and eligibility in the original filing.</p>{ipoItems.length ? <div className="research-news-list">{ipoItems.map((item,index)=><article className="research-news-item" key={item.url || index}><div className="news-meta"><span>{item.source || item.domain}</span><small>{item.published_at || item.seen_at || "Date not supplied"}</small></div><a href={item.url} target="_blank" rel="noreferrer">{item.title}</a></article>)}</div> : <div className="empty-data">No matching official IPO/public-issue headlines in the latest snapshot. Check the NSE and SEBI issue pages directly.</div>}<div className="resource-links"><a href="https://www.sebi.gov.in/filings/public-issues.html" target="_blank" rel="noreferrer">SEBI public issues <ExternalLink size={13}/></a><a href="https://www.nseindia.com/market-data/all-upcoming-issues-ipo" target="_blank" rel="noreferrer">NSE IPOs <ExternalLink size={13}/></a></div></div>
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
          <label>Bull case<textarea value={candidateBull} onChange={e=>setCandidateBull(e.target.value)} rows={2} placeholder="Optimistic scenario, assumptions and supporting evidence"/></label>
          <label>Base case<textarea value={candidateBase} onChange={e=>setCandidateBase(e.target.value)} rows={2} placeholder="Central scenario, assumptions and supporting evidence"/></label>
          <label>Bear case<textarea value={candidateBear} onChange={e=>setCandidateBear(e.target.value)} rows={2} placeholder="Downside scenario, failure modes and loss risks"/></label>
          <label>Fees, taxes and other costs<textarea value={candidateCosts} onChange={e=>setCandidateCosts(e.target.value)} rows={2} placeholder="Expense ratio, brokerage, tax, exit load, FX or custody costs"/></label>
          <label>Risks and counterarguments<textarea value={candidateRisks} onChange={e=>setCandidateRisks(e.target.value)} rows={3} placeholder="What could go wrong? What evidence would change your view?"/></label>
        </div>
        <div className="calculator-card">
          <div className="tool-heading"><ShieldCheck size={17}/><b>Review status</b></div>
          <div className="calc-result"><span>Evidence checklist</span><b>{researchComplete ? "Core fields entered" : "Incomplete"}</b></div>
          <p className="calc-foot">{researchComplete ? "The basic worksheet fields are filled. HTTPS format is checked, but the website does not verify that the source is official. This is not an approval, risk score or investment recommendation." : "Complete these items before treating the candidate as researched."}</p>
          {reviewGaps.length > 0 && <ul className="review-gaps">{reviewGaps.map(g=><li key={g}>{g}</li>)}</ul>}
          <div className="review-summary"><b>{candidateName.trim() || "No candidate entered"}</b><span>{candidateType} · {candidateHorizon}</span><span>Valuation: {candidateValuation}</span><span>Liquidity: {candidateLiquidity}</span><span>Source date: {candidateSourceDate || "Not recorded"}</span><span>Bull case: {candidateBull || "Not recorded"}</span><span>Base case: {candidateBase || "Not recorded"}</span><span>Bear case: {candidateBear || "Not recorded"}</span><span>Fees/tax: {candidateCosts || "Not recorded"}</span>{isHttpsUrl(candidateSource.trim()) && <a href={candidateSource.trim()} target="_blank" rel="noreferrer">Open primary source <ExternalLink size={12}/></a>}</div>
          {candidateRisks.trim() && <div className="review-summary"><b>Your risk notes</b><span>{candidateRisks}</span></div>}
          <p className="calc-foot">Never rely on one source. HTTPS format alone does not prove a website is official. Independently verify the issuer or regulator domain, document, fees, tax, concentration, currency exposure, eligibility, custody, fraud risk and downside scenarios.</p>
          <div className="resource-links"><button className="text-action" onClick={saveResearchCase} disabled={!researchComplete}>Save this research note locally <ArrowUpRight size={13}/></button>{researchSaved && <span className="success-note">Saved in this browser.</span>}</div>
          <p className="calc-foot">Saved notes remain only in this browser on this device. They are not encrypted or synced. Export a private backup if you need to keep them.</p>
        </div>
      </div>
    </div>
    <div className="panel workspace-panel"><h2>Saved research notes</h2><p>{researchCases.length} of 50 locally saved research notes. These are your own research records, not recommendations.</p><div className="resource-links"><button className="text-action" onClick={exportResearchCases} disabled={!researchCases.length}>Export research backup JSON <ArrowUpRight size={13}/></button></div>{researchCases.length ? <div className="holding-list">{researchCases.map(item=><div className="holding-row" key={item.id}><span><b>{item.name}</b><small> · {item.type} · {item.horizon} · saved {new Date(item.savedAt).toLocaleDateString()}</small><br/><a href={item.source} target="_blank" rel="noreferrer">Primary source <ExternalLink size={11}/></a></span><button onClick={()=>removeResearchCase(item.id)} aria-label={"Delete research note "+item.name}>Delete</button></div>)}</div> : <div className="empty-data">No saved notes yet. Complete the evidence checklist and save a candidate review.</div>}<p className="calc-foot">Local browser storage is not a secure vault. Do not store private account data, passwords or confidential documents here.</p></div>
    <div className="panel workspace-panel"><h2>Coverage checklist by asset class</h2><div className="checklist-grid">{[["IPO / public issue","DRHP/RHP, price band, dates, use of proceeds, promoter holdings, valuation, risks and official registrar."],["Mutual funds / ETFs","SID/KIM, expense ratio, benchmark, tracking difference, holdings, overlap and exit load."],["Bonds / T-bills / deposits","Issuer, yield-to-maturity, duration, credit risk, liquidity, tax and reinvestment risk."],["Gold / REITs / InvITs","Instrument structure, costs, cash flows, concentration, valuation and liquidity."],["International assets","FEMA/LRS route, broker eligibility, FX costs, withholding tax, local tax and custody."],["Digital assets","Regulatory, custody, counterparty, fraud, volatility and tax risks; no trading enabled."]].map(([title,desc])=><div className="check-tile" key={title}><ShieldCheck size={17}/><div><b>{title}</b><p>{desc}</p></div></div>)}</div></div>
    <div className="panel workspace-panel"><h2>Decision standard</h2><p>Every future research report should show bull/base/bear scenarios, dated evidence, valuation assumptions, fees, taxes, liquidity, downside scenarios, counterarguments and an “insufficient evidence” outcome when needed.</p></div>
  </div>;

  if (active === "News Intelligence") return <div className="workspace-stack">
    <div className="panel workspace-panel"><div className="eyebrow">GLOBAL EVENT MONITOR</div><h2>Official releases and global discovery</h2><p>Official RBI, SEBI, NSE, BSE, PIB, Federal Reserve and ECB items link to primary sources. GDELT items are a discovery index, not fact-checked. Check the original document, date and independent corroboration before relying on any claim.</p>
      <p className="calc-foot">Overall news snapshot: {providerStatus?.global_news?.status || "status unavailable"}{providerStatus?.global_news?.error ? " · "+providerStatus.global_news.error : ""}</p><div className="module-grid"><div className="module-tile"><b>GDELT news discovery</b><span>{providerStatus?.global_news?.discovery_status || "checking"} · {providerStatus?.global_news?.discovery_index_count ?? 0} items{providerStatus?.global_news?.discovery_error ? " · "+providerStatus.global_news.discovery_error : ""}</span></div>{(providerStatus?.global_news?.official_feeds || []).map(feed=><div className="module-tile" key={feed.provider}><b>{feed.provider}</b><span>{feed.status}{feed.items !== undefined ? " · "+feed.items+" items" : ""}{feed.error ? " · "+feed.error : ""}</span></div>)}</div>
      <div className="resource-links"><a href="https://www.rbi.org.in/Scripts/BS_PressReleaseDisplay.aspx" target="_blank" rel="noreferrer">RBI press releases <ExternalLink size={13}/></a><a href="https://www.pib.gov.in/" target="_blank" rel="noreferrer">Press Information Bureau <ExternalLink size={13}/></a><a href="https://www.sebi.gov.in/rss.html" target="_blank" rel="noreferrer">SEBI RSS <ExternalLink size={13}/></a><a href="https://www.nseindia.com/static/rss-feed" target="_blank" rel="noreferrer">NSE RSS <ExternalLink size={13}/></a><a href="https://www.bseindia.com/corporates/ann.html" target="_blank" rel="noreferrer">BSE announcements <ExternalLink size={13}/></a><a href="https://www.federalreserve.gov/newsevents/pressreleases.htm" target="_blank" rel="noreferrer">Federal Reserve <ExternalLink size={13}/></a><a href="https://www.ecb.europa.eu/press/html/index.en.html" target="_blank" rel="noreferrer">European Central Bank <ExternalLink size={13}/></a><a href="https://www.imf.org/en/News" target="_blank" rel="noreferrer">IMF News <ExternalLink size={13}/></a></div>
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
    <div className="panel workspace-panel"><div className="eyebrow">FINPILOT LEARNING ASSISTANT · GITHUB PAGES READY</div><h2>Ask a financial learning question</h2><p>This guided assistant runs entirely in your browser. It uses reviewed topic rules and educational explanations—no Ollama, local setup, API key, external AI provider or personal-data upload. It is not a generative AI model and cannot verify live market facts.</p>
      <div className="mentor-connection"><span className="connection-dot"></span><b>Ready · browser-based learning assistant</b><small>No account or server connection required</small></div>
      <div className="mentor-chat-window">{mentorMessages.length ? mentorMessages.map((message,index)=><div className={"mentor-message "+message.role} key={index}><b>{message.role === "user" ? "You" : "FinPilot · learning guide"}</b><p>{message.content}</p></div>) : <div className="empty-data">Try: “I have ₹0 to invest. What should I do first?” or “Explain FD vs T-bill.”</div>}</div>
      <textarea rows={3} value={mentorDraft} onChange={e=>setMentorDraft(e.target.value)} placeholder="Ask about savings, debt, SIPs, stocks, bonds, gold, IPOs, risk, tax or careers…" aria-label="Ask FinPilot learning assistant"/>
      <div className="resource-links"><button onClick={sendMentorMessage} disabled={!mentorDraft.trim()}>Ask FinPilot <ArrowUpRight size={13}/></button><button className="text-action" onClick={()=>setMentorMessages([])}>Clear chat</button></div>
      <p className="calc-foot">Answers are selected from built-in educational rules, not generated by an LLM. They are general information, not personalised investment, legal or tax advice. Check current facts with official sources before acting.</p>
    </div>
    <div className="panel workspace-panel"><h2>Risk guardrails</h2><div className="module-grid">{["No guaranteed-return claims","No leverage or derivatives","No automatic trading","No broker credentials stored","No unverified buy/sell signals","Capital preservation first"].map(x=><div className="module-tile" key={x}><ShieldCheck size={16}/><b>{x}</b></div>)}</div></div>
  </div>;

  if (active === "Portfolio") return <div className="workspace-stack">
    <div className="panel workspace-panel"><div className="eyebrow">DEVICE-LOCAL TRACKER</div><h2>Personal asset notes</h2><p>Entries are stored only in this browser on this device. They are not synced to an account or encrypted by FinPilot; export your own backup. Do not enter account numbers or sensitive identifiers.</p>
      <div className="form-row"><input value={assetName} onChange={e=>setAssetName(e.target.value)} placeholder="Asset label (e.g. Savings account)"/><input type="number" min="0" value={assetAmount} onChange={e=>setAssetAmount(e.target.value)} placeholder="Approx. value ₹"/><select value={assetCategory} onChange={e=>setAssetCategory(e.target.value)}><option>Cash & deposits</option><option>Equity / mutual funds</option><option>Bonds / fixed income</option><option>Gold / commodities</option><option>Property / REITs</option><option>International assets</option><option>Digital assets</option><option>Other</option></select><button onClick={saveHolding}>Add entry</button></div>{saved && <p className="success-note">Entry saved in this browser.</p>}
      <div className="holding-list">{holdings.length ? holdings.map((h,i)=><div className="holding-row" key={i}><span>{h.name} <small>· {h.category}</small></span><b>{money(h.amount)}</b><button onClick={()=>removeHolding(i)} aria-label={"Remove "+h.name}>Remove</button></div>) : <div className="empty-data">No entries yet. You can use this as a manual note tracker.</div>}</div>
      <div className="total-row"><span>Recorded total (not verified net worth)</span><b>{money(holdingTotal)}</b></div>
      {holdings.length > 0 && <div className="module-grid">{Array.from(allocation.entries()).map(([category, amount])=><div className="module-tile" key={category}><b>{category}</b><span>{money(amount)} · {holdingTotal > 0 ? (amount / holdingTotal * 100).toFixed(1) : "0.0"}% of recorded assets</span></div>)}</div>}
      <div className="calculator-card"><div className="tool-heading"><ShieldCheck size={17}/><b>Portfolio concentration review</b></div><p className="calc-foot">Simple concentration flags based on the values you entered. These are not a risk score and cannot assess asset quality, volatility, correlation, liquidity or tax.</p>{holdings.length ? <><div className="calc-result"><span>Largest single entry</span><b>{topHoldingShare.toFixed(1)}%</b></div><div className="calc-result"><span>Largest asset category</span><b>{categoryShares[0]?.category} · {categoryShares[0]?.share.toFixed(1)}%</b></div><ul className="review-gaps">{topHoldingShare > 30 && <li>One holding is over 30% of recorded assets. Review single-name concentration.</li>}{categoryShares[0]?.share > 60 && <li>One asset category is over 60%. Check whether this matches your goal and loss capacity.</li>}{holdings.some(item=>item.category==="Digital assets") && <li>Digital assets are volatile and may involve custody, platform and regulatory risks. Do not use emergency funds.</li>}{topHoldingShare <= 30 && categoryShares[0]?.share <= 60 && <li>No simple concentration threshold was crossed; this does not mean the portfolio is low-risk.</li>}</ul></> : <div className="empty-data">Add asset notes to see concentration checks.</div>}</div>
      <div className="resource-links"><button className="text-action" onClick={exportHoldings} disabled={!holdings.length}>Export backup JSON <ArrowUpRight size={13}/></button><label className="text-action">Import backup JSON<input type="file" accept=".json,application/json" onChange={e=>void importHoldingsFile(e.target.files?.[0])}/></label><button className="text-action" onClick={clearHoldings} disabled={!holdings.length}>Clear local entries</button></div>{importMessage && <p className="calc-foot">{importMessage}</p>}
      <p className="calc-foot">Export a backup before clearing browser data. The export is a plain JSON file; keep it private and do not upload it to a public repository.</p>
    </div>
  </div>;

  if (active === "Learning Centre") return <div className="workspace-stack">
    <div className="panel workspace-panel"><div className="eyebrow">BEGINNER LEARNING PATH</div><h2>Learn money in the right order</h2><p>Short, practical sequence. Finish one concept and test it with a real-world example before moving on.</p><div className="lesson-list">{lessons.map(([n,title,desc])=><div className="lesson-row" key={n}><span>{n}</span><div><b>{title}</b><p>{desc}</p></div></div>)}</div></div>
    <div className="panel workspace-panel"><h2>Free trusted learning sources</h2><div className="resource-links"><a href="https://investor.sebi.gov.in/" target="_blank" rel="noreferrer">SEBI Investor <ExternalLink size={13}/></a><a href="https://www.rbi.org.in/" target="_blank" rel="noreferrer">RBI <ExternalLink size={13}/></a><a href="https://www.nism.ac.in/" target="_blank" rel="noreferrer">NISM <ExternalLink size={13}/></a><a href="https://www.investor.gov/" target="_blank" rel="noreferrer">Investor.gov <ExternalLink size={13}/></a></div></div>
  </div>;

  if (active === "Career & Income") return <div className="workspace-stack">
    <div className="panel workspace-panel"><div className="eyebrow">EARNING POWER</div><h2>Career and income research</h2><p>Official starting points for recruitment and apprenticeships. Always confirm eligibility, age cut-off, category rules, location, dates and fees in the original notification.</p><div className="career-list">{careerLinks.map(([name,desc,url])=><a href={url} target="_blank" rel="noreferrer" key={name}><BriefcaseBusiness size={16}/><div><b>{name}</b><span>{desc}</span></div><ArrowUpRight size={14}/></a>)}</div></div>
    <div className="panel workspace-panel"><h2>Useful finance and technology pathways</h2><div className="checklist-grid">{[["Finance operations / banking","Excel or Sheets, accounting basics, reconciliations, KYC/AML awareness, clear written communication."],["Business / data analyst","SQL, Python, spreadsheets, Power BI, statistics, data cleaning and concise business reporting."],["Risk / compliance analyst","Financial products, regulatory reading, controls, audit trails, fraud indicators and evidence documentation."],["Software / fintech support","Python or JavaScript, APIs, SQL, debugging, security basics and customer problem-solving."]].map(([title,desc])=><div className="check-tile" key={title}><BriefcaseBusiness size={17}/><div><b>{title}</b><p>{desc}</p></div></div>)}</div><p className="calc-foot">These are role families and skill suggestions, not confirmed vacancies. Check each official notification for eligibility, location, deadlines and fees.</p></div>
  </div>;

  return <div className="workspace-stack">
    <div className="panel workspace-panel"><div className="eyebrow">FINANCIAL TOOLS</div><h2>Simple planning calculators</h2><p>Illustrative calculations only. They are not forecasts, promises or investment recommendations.</p>
      <div className="calculator-grid">
        <div className="calculator-card"><div className="tool-heading"><Wallet size={17}/><b>Goal funding planner</b></div><label>Goal name<input value={goalName} onChange={e=>setGoalName(e.target.value)} placeholder="e.g. Education, vehicle, home"/></label><label>Today's goal cost (₹)<input type="number" min="0" value={goalTarget} onChange={e=>setGoalTarget(e.target.value)}/></label><label>Already saved (₹)<input type="number" min="0" value={goalCurrent} onChange={e=>setGoalCurrent(e.target.value)}/></label><label>Years until goal<input type="number" min="1" max="50" value={goalYears} onChange={e=>setGoalYears(e.target.value)}/></label><label>Assumed annual inflation (%)<input type="number" min="0" max="30" step="0.5" value={goalInflation} onChange={e=>setGoalInflation(e.target.value)}/></label><label>Optional annual return assumption (%)<input type="number" min="0" max="30" step="0.5" value={goalReturn} onChange={e=>setGoalReturn(e.target.value)}/></label><div className="calc-result"><span>Estimated future cost · {goalName || "Goal"}</span><b>{money(goalProjection.futureTarget)}</b></div><div className="calc-result"><span>Monthly saving needed at 0% return</span><b>{money(goalProjection.zeroReturnMonthly)}</b></div><div className="calc-result"><span>Monthly contribution at selected return assumption</span><b>{money(goalProjection.monthlyAtAssumption)}</b></div><p className="calc-foot">Inflation and return are assumptions, not forecasts. The 0% return figure is the conservative savings reference. The return-based figure excludes taxes, fees and volatility; never use it as a promise.</p></div>
        <div className="calculator-card"><div className="tool-heading"><ShieldCheck size={17}/><b>Debt payoff estimator</b></div><label>Outstanding debt (₹)<input type="number" min="0" value={debtBalance} onChange={e=>setDebtBalance(e.target.value)}/></label><label>Annual interest rate (%)<input type="number" min="0" max="100" step="0.1" value={debtRate} onChange={e=>setDebtRate(e.target.value)}/></label><label>Monthly payment (₹)<input type="number" min="0" value={debtPayment} onChange={e=>setDebtPayment(e.target.value)}/></label><div className="calc-result"><span>Estimated payoff time</span><b>{debtProjection.status === "Illustrative payoff estimate" ? (Math.floor(debtProjection.months/12) + "y " + (debtProjection.months%12) + "m") : debtProjection.status}</b></div><div className="calc-result"><span>Estimated interest paid</span><b>{money(debtProjection.interest)}</b></div><div className="calc-result"><span>Total estimated payments</span><b>{money(debtProjection.totalPaid)}</b></div><p className="calc-foot">Assumes a constant rate and fixed monthly payment, with monthly interest and no new borrowing, penalties or fees. Actual lender schedules and prepayment rules differ. Keep minimum payments current and verify terms with your lender.</p></div>
        <div className="calculator-card"><div className="tool-heading"><Wallet size={17}/><b>Monthly cash-flow check</b></div><label>Monthly take-home income (₹)<input type="number" min="0" value={monthlyIncome} onChange={e=>setMonthlyIncome(e.target.value)}/></label><label>Monthly expenses (₹)<input type="number" min="0" value={monthlyExpenses} onChange={e=>setMonthlyExpenses(e.target.value)}/></label><div className="calc-result"><span>Monthly surplus / shortfall</span><b>{money(monthlySurplus)}</b></div><label>Emergency reserve horizon<select value={emergencyMonths} onChange={e=>setEmergencyMonths(e.target.value)}><option value="3">3 months</option><option value="6">6 months</option><option value="9">9 months</option><option value="12">12 months</option></select></label><label>Existing emergency savings (₹)<input type="number" min="0" value={currentReserve} onChange={e=>setCurrentReserve(e.target.value)}/></label><div className="calc-result"><span>Illustrative reserve target</span><b>{money(emergencyTarget)}</b></div><div className="calc-result"><span>Remaining reserve gap</span><b>{money(emergencyGap)}</b></div><p className="calc-foot">A positive surplus is not automatically investable. Reserve months are a planning choice, not a universal rule; consider income stability, dependants, debt and health/insurance cover.</p></div>
        <div className="calculator-card"><div className="tool-heading"><Calculator size={17}/><b>SIP illustration</b></div><label>Monthly contribution (₹)<input type="number" min="0" value={sip} onChange={e=>setSip(e.target.value)}/></label><label>Years<input type="number" min="1" max="60" value={years} onChange={e=>setYears(e.target.value)}/></label><label>Assumed annual return (%)<input type="number" min="-50" max="50" step="0.5" value={rate} onChange={e=>setRate(e.target.value)}/></label><div className="calc-result"><span>Illustrative future value</span><b>{money(projected)}</b></div><p className="calc-foot">Assumed constant return, monthly compounding and month-end contributions; actual returns vary and can be negative. Taxes and fees excluded. Keep this at ₹0 until you have a reliable surplus and safety reserve.</p></div>
      </div>
    </div>
  </div>;
}
