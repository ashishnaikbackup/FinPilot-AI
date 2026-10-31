import { useMemo, useState } from "react";
import {
  Activity, ArrowDownRight, ArrowUpRight, Bell, BookOpen, BriefcaseBusiness,
  CalendarDays, ChevronDown, CircleHelp, Compass, Globe2, Landmark, LayoutDashboard,
  Menu, Newspaper, Search, ShieldCheck, SlidersHorizontal, Sparkles, TrendingUp,
  Wallet, X
} from "lucide-react";
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis
} from "recharts";

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

const trendData = [
  { day: "Mon", india: 48, global: 36 }, { day: "Tue", india: 53, global: 41 },
  { day: "Wed", india: 49, global: 44 }, { day: "Thu", india: 61, global: 48 },
  { day: "Fri", india: 57, global: 45 }, { day: "Sat", india: 68, global: 53 },
  { day: "Sun", india: 72, global: 59 }
];

const markets = [
  { name: "NIFTY 50", area: "India · Equity index", value: "—", change: "Connect data source", up: true },
  { name: "SENSEX", area: "India · Equity index", value: "—", change: "Connect data source", up: true },
  { name: "S&P 500", area: "United States · Equity index", value: "—", change: "Connect data source", up: true },
  { name: "NASDAQ 100", area: "United States · Equity index", value: "—", change: "Connect data source", up: true }
];
const opportunities = [
  { type: "IPO WATCH", title: "Upcoming & open issues", text: "Review offer documents, valuation, risks and dates before applying.", tag: "Research queue" },
  { type: "FIXED INCOME", title: "Bonds & government securities", text: "Compare yield-to-maturity, duration, credit quality and liquidity.", tag: "Compare carefully" },
  { type: "FUNDS & ETFs", title: "Diversified investment options", text: "Compare costs, benchmark, tracking error and portfolio overlap.", tag: "Learn first" }
];
const news = [
  { category: "CENTRAL BANKS", title: "Track RBI, Federal Reserve and other policy decisions", desc: "Rate decisions can influence borrowing costs, bonds, currencies and equity valuations.", time: "Monitoring topic" },
  { category: "GEOPOLITICS", title: "Follow conflicts, sanctions and global supply chains", desc: "FinPilot will connect confirmed events to potential sector and asset impacts.", time: "Monitoring topic" },
  { category: "CORPORATE", title: "Watch earnings, disclosures and company risk signals", desc: "Use exchange filings and issuer disclosures as primary evidence.", time: "Monitoring topic" }
];

function App() {
  const [active, setActive] = useState<Section>("Overview");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [showNotice, setShowNotice] = useState(true);
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
        <div className="top-actions"><div className="search-box"><Search size={16}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search markets..." /></div><button className="icon-button" aria-label="Notifications"><Bell size={18}/><i/></button><div className="top-avatar">FP</div></div>
      </header>

      <div className="page-content">
        <section className="welcome-row"><div><div className="eyebrow"><span className="pulse"/> YOUR FINANCIAL COMMAND CENTRE</div><h1>{greeting}. <span>Let's build your financial edge.</span></h1><p>Understand the world. Research opportunities. Make better-informed decisions.</p></div><button className="date-pill"><CalendarDays size={15}/> {new Intl.DateTimeFormat("en-IN",{day:"2-digit",month:"short",year:"numeric"}).format(new Date())}</button></section>

        {showNotice && <div className="demo-notice"><div className="notice-icon"><CircleHelp size={18}/></div><div><b>Research workspace is being set up</b><p>Figures and charts on this screen are illustrative placeholders, not live prices or investment advice. Data feeds will be added with source and timestamp labels.</p></div><button onClick={() => setShowNotice(false)} aria-label="Dismiss notice"><X size={16}/></button></div>}

        {active !== "Overview" && <div className="section-banner"><div className="section-icon"><Sparkles size={19}/></div><div><b>{active}</b><p>This module is part of the FinPilot roadmap. The first release establishes its interface and data foundations.</p></div><span className="status-chip">PHASE 1 FOUNDATION</span></div>}

        <section className="stat-grid">
          <StatCard icon={<Wallet/>} label="Investable capital" value="₹0.00" hint="Starting point · no pressure to invest" tone="blue"/>
          <StatCard icon={<TrendingUp/>} label="Portfolio value" value="Not connected" hint="Add assets when you have them" tone="violet"/>
          <StatCard icon={<Globe2/>} label="Markets tracked" value="4 watchlist indices" hint="Live feed not connected" tone="cyan"/>
          <StatCard icon={<ShieldCheck/>} label="Risk posture" value="Capital first" hint="No leverage · no auto-trading" tone="green"/>
        </section>

        <section className="content-grid">
          <div className="panel market-panel">
            <div className="panel-heading"><div><div className="eyebrow">MARKET PULSE</div><h2>Global market watch</h2></div><button className="subtle-button" onClick={() => setActive("Markets")}>Explore markets <ArrowUpRight size={14}/></button></div>
            <div className="chart-legend"><span><i className="legend-india"/> Illustrative trend A</span><span><i className="legend-global"/> Illustrative trend B</span><em>DEMO INDEX · NOT MARKET DATA</em></div>
            <div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><AreaChart data={trendData} margin={{top:12,right:4,left:-20,bottom:0}}><defs><linearGradient id="a" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6d7cff" stopOpacity={0.28}/><stop offset="100%" stopColor="#6d7cff" stopOpacity={0}/></linearGradient><linearGradient id="b" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#39c6b0" stopOpacity={0.18}/><stop offset="100%" stopColor="#39c6b0" stopOpacity={0}/></linearGradient></defs><CartesianGrid stroke="#222b40" vertical={false}/><XAxis dataKey="day" tick={{fill:"#77839c",fontSize:11}} axisLine={false} tickLine={false}/><YAxis tick={{fill:"#77839c",fontSize:11}} axisLine={false} tickLine={false}/><Tooltip contentStyle={{background:"#111a2c",border:"1px solid #2b3852",borderRadius:12,color:"#fff"}}/><Area type="monotone" dataKey="india" stroke="#8490ff" strokeWidth={2.5} fill="url(#a)"/><Area type="monotone" dataKey="global" stroke="#42c8b2" strokeWidth={2.5} fill="url(#b)"/></AreaChart></ResponsiveContainer></div>
            <div className="market-strip">{filteredMarkets.map(m => <div className="market-mini" key={m.name}><div><b>{m.name}</b><span>{m.area}</span></div><div className="market-value">{m.value}<small>{m.change}</small></div></div>)}</div>
          </div>

          <div className="panel mentor-panel"><div className="mentor-orb"><Sparkles size={22}/></div><div className="eyebrow">YOUR AI FINANCIAL MENTOR</div><h2>Build the foundation before the portfolio.</h2><p>Your first milestone isn't picking a stock. It's building earning power, understanding risk and creating a financial safety net.</p><div className="mentor-checks"><div><ShieldCheck size={15}/> Protect capital first</div><div><BookOpen size={15}/> Learn before investing</div><div><Compass size={15}/> Research, don't chase</div></div><button className="primary-button" onClick={() => setActive("AI Mentor")}>Open mentor workspace <ArrowUpRight size={15}/></button></div>
        </section>

        <section className="lower-grid">
          <div className="panel"><div className="panel-heading"><div><div className="eyebrow">RESEARCH RADAR</div><h2>Explore opportunities</h2></div><button className="subtle-button" onClick={() => setActive("Opportunities")}>View all <ArrowUpRight size={14}/></button></div><div className="opportunity-list">{opportunities.map(o => <div className="opportunity" key={o.title}><div className="opportunity-icon"><Landmark size={18}/></div><div className="opportunity-copy"><small>{o.type}</small><b>{o.title}</b><p>{o.text}</p></div><span className="tag">{o.tag}</span></div>)}</div></div>
          <div className="panel"><div className="panel-heading"><div><div className="eyebrow">WORLD MONITOR</div><h2>Intelligence to watch</h2></div><button className="subtle-button" onClick={() => setActive("News Intelligence")}>Open feed <ArrowUpRight size={14}/></button></div><div className="news-list">{news.map(n => <div className="news-item" key={n.title}><div className="news-meta"><span>{n.category}</span><small>{n.time}</small></div><b>{n.title}</b><p>{n.desc}</p></div>)}</div></div>
        </section>

        <section className="footer-grid"><div className="foot-card"><div className="foot-icon"><BookOpen/></div><div><b>Learn the language of money</b><p>Plain-English explainers, from bonds and ETFs to inflation and valuation.</p><button onClick={() => setActive("Learning Centre")}>Go to learning centre <ArrowUpRight size={13}/></button></div></div><div className="foot-card"><div className="foot-icon"><BriefcaseBusiness/></div><div><b>Grow your earning power</b><p>Build skills, explore career paths and find legitimate income opportunities.</p><button onClick={() => setActive("Career & Income")}>Explore career workspace <ArrowUpRight size={13}/></button></div></div></section>
        <footer><span>FINPILOT AI · RESEARCH BEFORE ACTION</span><span>Educational use only · Market data not connected</span></footer>
      </div>
    </main>
  </div>;
}

function StatCard({icon,label,value,hint,tone}:{icon:React.ReactNode;label:string;value:string;hint:string;tone:string}) {
  return <div className="stat-card"><div className={`stat-icon ${tone}`}>{icon}</div><div className="stat-label">{label}</div><div className="stat-value">{value}</div><div className="stat-hint">{hint}</div></div>;
}
export default App;