import { useEffect, useMemo, useState } from "react";
import {
  Activity, ArrowUpRight, Bell, BookOpen, BriefcaseBusiness,
  CalendarDays, ChevronDown, CircleHelp, Compass, Globe2, Landmark, LayoutDashboard,
  Menu, Newspaper, Search, ShieldCheck, Sparkles, TrendingUp,
  Wallet, X
} from "lucide-react";
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis
} from "recharts";
import Workspace from "./Workspace";

type Section = "Overview" | "Markets" | "Opportunities" | "News Intelligence" | "AI Mentor" | "Portfolio" | "Learning Centre" | "Career & Income";
const navItems: { label: Section; icon: typeof LayoutDashboard }[] = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "Markets", icon: Globe2 },
  { label: "Opportunities", icon: Compass },
  { label: "News Intelligence", icon: Newspaper },
  { label: "AI Mentor", icon: Sparkles },
  { label: "Portfolio", icon: Wallet },
  { label: "Learning Centre", icon: BookOpen },
  { label: "Career & Income", icon: BriefcaseBusiness }
];

type MacroPoint = { date: string; value: number };
type NewsItem = { title: string; url: string; domain: string; seen_at: string; source_country: string; source?: string; source_type?: string; published_at?: string | null };
type StatusPayload = {
  retrieved_at: string;
  refresh_interval: string;
  market_quotes: { status: string; message: string; freshness: string };
  india_macro: { status: string; freshness: string; provider: string; message: string; error?: string | null };
  global_news: { status: string; freshness: string; provider: string; caveat: string; official_primary_source_count?: number; discovery_index_count?: number; official_feeds?: {provider:string;status:string;items?:number;error?:string}[]; error?: string | null };
  sec_filings: { status: string; provider: string; message: string };
};
const markets = [
  { name: "NIFTY 50", area: "India · NSE index", value: "—", change: "Licensed quote feed required" },
  { name: "SENSEX", area: "India · BSE index", value: "—", change: "Licensed quote feed required" },
  { name: "S&P 500", area: "United States · Equity index", value: "—", change: "Quote provider not configured" },
  { name: "NASDAQ 100", area: "United States · Equity index", value: "—", change: "Quote provider not configured" }
];
const opportunities = [
  { type: "IPO WATCH", title: "Upcoming & open issues", text: "Review offer documents, valuation, risks and dates before applying.", tag: "Research queue" },
  { type: "FIXED INCOME", title: "Bonds & government securities", text: "Compare yield-to-maturity, duration, credit quality and liquidity.", tag: "Compare carefully" },
  { type: "FUNDS & ETFs", title: "Diversified investment options", text: "Compare costs, benchmark, tracking error and portfolio overlap.", tag: "Learn first" }
];
function App() {
  const [active, setActive] = useState<Section>("Overview");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [showNotice, setShowNotice] = useState(true);
  const [apiState, setApiState] = useState<"loading" | "connected" | "partial" | "offline">("loading");
  const [providerStatus, setProviderStatus] = useState<StatusPayload | null>(null);
  const [macroSeries, setMacroSeries] = useState<MacroPoint[]>([]);
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [lastRefresh, setLastRefresh] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function loadIntelligence() {
      try {
      const base = import.meta.env.BASE_URL;
      const results = await Promise.allSettled([
        fetch(base + "data/status.json"),
        fetch(base + "data/macro-india-gdp.json"),
        fetch(base + "data/news-global.json")
      ]);
      if (cancelled) return;
      let successes = 0;
      let macroLoaded = false;
      let newsLoaded = false;
      const [statusResult, macroResult, newsResult] = results;
      let loadedStatus: StatusPayload | null = null;
      if (statusResult.status === "fulfilled" && statusResult.value.ok) {
        loadedStatus = await statusResult.value.json();
        setProviderStatus(loadedStatus);
        successes += 1;
      }
      if (macroResult.status === "fulfilled" && macroResult.value.ok) {
        const macro = await macroResult.value.json();
        const points = (macro.observations || [])
          .filter((item: {date:string;value:number|null}) => item.value !== null)
          .map((item: {date:string;value:number}) => ({date:item.date,value:item.value}));
        setMacroSeries(points);
        macroLoaded = true;
        successes += 1;
      }
      if (newsResult.status === "fulfilled" && newsResult.value.ok) {
        const news = await newsResult.value.json();
        setNewsItems(news.articles || []);
        newsLoaded = true;
        successes += 1;
      }
      const sourcesAvailable = macroLoaded && newsLoaded && loadedStatus?.india_macro.status === "available" && loadedStatus?.global_news.status === "available";
      setApiState(successes === 0 ? "offline" : sourcesAvailable ? "connected" : "partial");
      setLastRefresh(loadedStatus?.retrieved_at ? new Date(loadedStatus.retrieved_at).toLocaleString("en-IN") : "timestamp unavailable");
      } catch {
        if (!cancelled) setApiState("partial");
      }
    }
    loadIntelligence();
    return () => { cancelled = true; };
  }, []);
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    return hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  }, []);
  const filteredMarkets = markets.filter(m => (m.name + m.area).toLowerCase().includes(query.toLowerCase()));

  return <div className="app-shell">
    <aside className={`sidebar ${mobileOpen ? "open" : ""}`}>
      <div className="brand"><div className="brand-mark"><Activity size={21}/></div><div><b>finpilot<span>.ai</span></b><small>FINANCIAL INTELLIGENCE</small></div><button className="mobile-close" onClick={() => setMobileOpen(false)} aria-label="Close menu"><X size={18}/></button></div>
      <div className="workspace-label">WORKSPACE</div>
      <nav>{navItems.map(({label, icon: Icon}) => <button key={label} className={`nav-link ${active === label ? "active" : ""}`} onClick={() => {setActive(label); setMobileOpen(false);}}><Icon size={18}/><span>{label}</span>{label === "News Intelligence" && <i className="nav-dot"/>}</button>)}</nav>
      <div className="sidebar-bottom">
        <div className="security-note"><ShieldCheck size={17}/><div><b>Research-first mode</b><span>No live trades enabled</span></div></div>
        <div className="profile"><div className="avatar">FP</div><div><b>Personal workspace</b><span>India · INR</span></div><ChevronDown size={15}/></div>
      </div>
    </aside>

    <main className="main-area">
      <header className="topbar">
        <button className="menu-button" onClick={() => setMobileOpen(true)} aria-label="Open menu"><Menu/></button>
        <div className="breadcrumbs">Workspace <span>/</span> <b>{active}</b></div>
        <div className="top-actions"><div className="search-box"><Search size={16}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder={active === "Overview" || active === "Markets" ? "Search markets..." : "Search disabled here"} disabled={active !== "Overview" && active !== "Markets"} /></div><a className="icon-button" href="https://github.com/ashishnaikbackup/FinPilot-AI/actions" target="_blank" rel="noreferrer" aria-label="Open update history" title="Open data refresh and software update history"><Bell size={18}/><i/></a><div className="top-avatar">FP</div></div>
      </header>

      <div className="page-content">
        <section className="welcome-row"><div><div className="eyebrow"><span className="pulse"/> YOUR FINANCIAL COMMAND CENTRE</div><h1>{greeting}. <span>Let's build your financial edge.</span></h1><p>Understand the world. Research opportunities. Make better-informed decisions.</p></div><div className="date-pill"><CalendarDays size={15}/> {new Intl.DateTimeFormat("en-IN",{day:"2-digit",month:"short",year:"numeric"}).format(new Date())}</div></section>

        {showNotice && <div className="demo-notice"><div className="notice-icon"><CircleHelp size={18}/></div><div><b>{apiState === "connected" ? "Public data snapshots available" : apiState === "partial" ? "Some public data sources are unavailable" : apiState === "loading" ? "Loading public data snapshots" : "Public data snapshots unavailable"}</b><p>{apiState === "connected" ? "The latest scheduled public-source snapshots are loaded. Exchange prices still require a licensed market-data feed." : apiState === "partial" ? "At least one source did not refresh successfully. Check source status and timestamps; missing values are not filled with guesses." : apiState === "loading" ? "Loading the latest snapshots refreshed by GitHub Actions." : "No public data snapshots were loaded. Check the scheduled refresh workflow. No market prices or headlines are invented when a source is unavailable."}</p></div><button onClick={() => setShowNotice(false)} aria-label="Dismiss notice"><X size={16}/></button></div>}

        {active === "Overview" && <>
        <section className="stat-grid">
          <StatCard icon={<Wallet/>} label="Investable capital" value="₹0.00" hint="Starting point · no pressure to invest" tone="blue"/>
          <StatCard icon={<TrendingUp/>} label="Portfolio value" value="Not connected" hint="Add assets when you have them" tone="violet"/>
          <StatCard icon={<Globe2/>} label="Markets tracked" value="4 indices" hint="Quote feed not connected" tone="cyan"/>
          <StatCard icon={<ShieldCheck/>} label="Risk posture" value="Capital first" hint="No leverage · no auto-trading" tone="green"/>
        </section>

        <section className="content-grid">
          <div className="panel market-panel">
            <div className="panel-heading"><div><div className="eyebrow">MARKET PULSE</div><h2>India economic snapshot</h2></div><button className="subtle-button" onClick={() => setActive("Markets")}>Explore markets <ArrowUpRight size={14}/></button></div>
            <div className="chart-legend"><span><i className="legend-india"/> India GDP · current US$</span><em>{providerStatus?.india_macro.provider || "World Bank"} · annual observations</em></div>
            <div className="chart-wrap">{macroSeries.length ? <ResponsiveContainer width="100%" height="100%"><AreaChart data={macroSeries} margin={{top:12,right:4,left:-20,bottom:0}}><defs><linearGradient id="macro" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#8490ff" stopOpacity={0.28}/><stop offset="100%" stopColor="#8490ff" stopOpacity={0}/></linearGradient></defs><CartesianGrid stroke="#222b40" vertical={false}/><XAxis dataKey="date" tick={{fill:"#77839c",fontSize:10}} axisLine={false} tickLine={false}/><YAxis tick={{fill:"#77839c",fontSize:10}} axisLine={false} tickLine={false} tickFormatter={(v:number) => (v/1e12).toFixed(1)+"T"}/><Tooltip formatter={(v) => "$"+(Number(v)/1e12).toFixed(2)+" trillion"} contentStyle={{background:"#111a2c",border:"1px solid #2b3852",borderRadius:12,color:"#fff"}}/><Area type="monotone" dataKey="value" name="GDP" stroke="#8490ff" strokeWidth={2.5} fill="url(#macro)"/></AreaChart></ResponsiveContainer> : <div className="empty-data">{apiState === "offline" ? "Waiting for the scheduled public-data snapshot." : "Loading World Bank observations…"}</div>}</div>
            <div className="market-strip">{filteredMarkets.map(m => <div className="market-mini" key={m.name}><div><b>{m.name}</b><span>{m.area}</span></div><div className="market-value">{m.value}<small>{m.change}</small></div></div>)}</div>
          </div>

          <div className="panel mentor-panel"><div className="mentor-orb"><Sparkles size={22}/></div><div className="eyebrow">YOUR FINANCIAL MENTOR</div><h2>Build the foundation before the portfolio.</h2><p>Your first milestone isn't picking a stock. It's building earning power, understanding risk and creating a financial safety net.</p><div className="mentor-checks"><div><ShieldCheck size={15}/> Protect capital first</div><div><BookOpen size={15}/> Learn before investing</div><div><Compass size={15}/> Research, don't chase</div></div><button className="primary-button" onClick={() => setActive("AI Mentor")}>Open mentor workspace <ArrowUpRight size={15}/></button></div>
        </section>

        <section className="lower-grid">
          <div className="panel"><div className="panel-heading"><div><div className="eyebrow">RESEARCH RADAR</div><h2>Explore opportunities</h2></div><button className="subtle-button" onClick={() => setActive("Opportunities")}>View all <ArrowUpRight size={14}/></button></div><div className="opportunity-list">{opportunities.map(o => <div className="opportunity" key={o.title}><div className="opportunity-icon"><Landmark size={18}/></div><div className="opportunity-copy"><small>{o.type}</small><b>{o.title}</b><p>{o.text}</p></div><span className="tag">{o.tag}</span></div>)}</div></div>
          <div className="panel"><div className="panel-heading"><div><div className="eyebrow">WORLD MONITOR</div><h2>Intelligence to watch</h2></div><button className="subtle-button" onClick={() => setActive("News Intelligence")}>Open feed <ArrowUpRight size={14}/></button></div><div className="news-list">{newsItems.length ? newsItems.map((n,i) => <div className="news-item" key={n.url || i}><div className="news-meta"><span>{n.source || n.domain || "NEWS DISCOVERY"}</span><small>{n.published_at ? "Published " + n.published_at : "Indexed " + (n.seen_at || "time unavailable")}</small></div><a className="news-link" href={n.url} target="_blank" rel="noreferrer">{n.title}</a><p>{n.source_type === "official_primary_source" ? "Official primary-source update · read the linked release in full." : "Discovery result · verify against the original report and independent sources before acting."}</p></div>) : <div className="empty-data">{apiState === "offline" ? "News discovery is unavailable in the latest public snapshot." : "Loading recent coverage…"}</div>}</div></div>
        </section>

        <section className="footer-grid"><div className="foot-card"><div className="foot-icon"><BookOpen/></div><div><b>Learn the language of money</b><p>Plain-English explainers, from bonds and ETFs to inflation and valuation.</p><button onClick={() => setActive("Learning Centre")}>Go to learning centre <ArrowUpRight size={13}/></button></div></div><div className="foot-card"><div className="foot-icon"><BriefcaseBusiness/></div><div><b>Grow your earning power</b><p>Build skills, explore career paths and find legitimate income opportunities.</p><button onClick={() => setActive("Career & Income")}>Explore career workspace <ArrowUpRight size={13}/></button></div></div></section>
        <Workspace active="Overview" query={query} newsItems={newsItems} providerStatus={providerStatus}/>
        </>}
        {active !== "Overview" && <Workspace active={active} query={query} newsItems={newsItems} providerStatus={providerStatus}/>}
        <div className="data-footnote"><b>Data integrity</b><span>Public data: {apiState} {lastRefresh ? "· snapshot " + lastRefresh : ""}</span><span>India GDP: {providerStatus?.india_macro.status || "checking"}</span><span>Exchange quotes: {providerStatus?.market_quotes.status || "checking"}</span><span>News: {providerStatus?.global_news.status || "checking"} · {providerStatus?.global_news.official_primary_source_count ?? 0} official / {providerStatus?.global_news.discovery_index_count ?? 0} discovery</span></div><footer><span>FINPILOT AI · RESEARCH BEFORE ACTION</span><span>Educational use only · Not investment advice</span></footer>
      </div>
    </main>
  </div>;
}

function StatCard({icon,label,value,hint,tone}:{icon:React.ReactNode;label:string;value:string;hint:string;tone:string}) {
  return <div className="stat-card"><div className={`stat-icon ${tone}`}>{icon}</div><div className="stat-label">{label}</div><div className="stat-value">{value}</div><div className="stat-hint">{hint}</div></div>;
}
export default App;