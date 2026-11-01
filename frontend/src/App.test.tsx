import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { money, price, sipProjection } from "./lib/finance";

const NAV = ["Overview", "Markets", "Opportunities", "News Intelligence", "AI Mentor", "Portfolio", "Learning Centre", "Career & Income"];
const NOW = "2026-10-31T10:00:00+00:00";

const files: Record<string, unknown> = {
  "status.json": {
    retrieved_at: NOW, refresh_interval: "hourly",
    market_quotes: { status: "not_connected", message: "none", freshness: "unavailable" },
    india_macro: { status: "available", freshness: "annual", provider: "World Bank", message: "ok" },
    global_news: { status: "available", freshness: "rolling", provider: "RSS+GDELT", caveat: "c", official_primary_source_count: 2, discovery_index_count: 1, discovery_status: "available", official_feeds: [{ provider: "RBI Press Releases", status: "available", items: 2 }] },
    sec_filings: { status: "not_in_static_snapshot", provider: "SEC", message: "n/a" }
  },
  "macro-india-gdp.json": { observations: [{ date: "2022", value: 3.2e12 }, { date: "2023", value: 3.5e12 }] },
  "macro-global.json": { retrieved_at: NOW, freshness: "annual_dataset", observations: [{ country_code: "IND", country: "India", indicator_code: "NY.GDP.MKTP.KD.ZG", indicator: "GDP growth", date: "2023", value: 7.6 }] },
  "news-global.json": {
    articles: [
      { title: "RBI keeps repo rate unchanged in monetary policy review", url: "https://www.rbi.org.in/pr/1", domain: "www.rbi.org.in", source: "RBI Press Releases", source_type: "official_primary_source" },
      { title: "RBI holds repo rate steady, monetary policy statement", url: "https://rbi.org.in/pr/2", domain: "rbi.org.in", source: "RBI Press Releases", source_type: "official_primary_source" },
      { title: "Malicious link item", url: "javascript:alert(1)", source_type: "discovery_unverified" },
      { title: "Crude oil climbs as OPEC trims supply", url: "https://news.example/oil", domain: "news.example", source_type: "discovery_unverified" }
    ]
  }
};

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
    const name = String(input).split("/").pop() || "";
    return name in files ? { ok: true, json: async () => files[name] } : { ok: false, json: async () => ({}) };
  }));
});

async function open(user: ReturnType<typeof userEvent.setup>, label: string) {
  await user.click(screen.getByRole("button", { name: label }));
}

describe("app shell and navigation", () => {
  it("loads public snapshots and reports their state honestly", async () => {
    render(<App />);
    expect(await screen.findByText("Public data snapshots available")).toBeInTheDocument();
    expect(screen.getByText(/Educational use only · Not investment advice/)).toBeInTheDocument();
  });

  it("reports unavailable snapshots instead of inventing data", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, json: async () => ({}) })));
    render(<App />);
    expect(await screen.findByText("Public data snapshots unavailable")).toBeInTheDocument();
  });

  it("opens every workspace section without crashing and updates the page title", async () => {
    const user = userEvent.setup();
    render(<App />);
    for (const label of NAV) {
      await open(user, label);
      expect(document.title).toBe(label === "Overview" ? "FinPilot AI — Financial Intelligence" : `${label} | FinPilot AI`);
      expect(screen.getAllByRole("heading", { level: 1 }).length).toBeGreaterThan(0);
    }
  });
});

describe("financial calculators", () => {
  it("SIP illustration shows value, amount contributed and gain", async () => {
    const user = userEvent.setup();
    render(<App />);
    const monthly = screen.getByLabelText(/Monthly contribution/);
    await user.clear(monthly);
    await user.type(monthly, "5000");
    const r = sipProjection(5000, 10, 10);
    expect(await screen.findByText(money(r.futureValue))).toBeInTheDocument();
    expect(screen.getByText(`${money(r.invested)} · ${money(r.gain)}`)).toBeInTheDocument();
  });

  it("tolerates invalid and empty inputs without NaN or crashes", async () => {
    const user = userEvent.setup();
    render(<App />);
    const target = screen.getByLabelText(/Today's goal cost/);
    await user.clear(target);
    await user.type(target, "-500");
    expect(document.body.textContent).not.toMatch(/NaN|Infinity/);
  });
});

describe("portfolio: paper simulator", () => {
  async function addPosition(user: ReturnType<typeof userEvent.setup>, f: { symbol: string; qty: string; entry: string; mark?: string; fees: string }) {
    await user.type(screen.getByLabelText("Symbol or asset label"), f.symbol);
    const qty = screen.getByLabelText("Quantity"); await user.clear(qty); await user.type(qty, f.qty);
    await user.type(screen.getByLabelText("Entry price in rupees"), f.entry);
    if (f.mark) await user.type(screen.getByLabelText(/Manual mark price in rupees/), f.mark);
    const fees = screen.getByLabelText("Estimated fees in rupees"); await user.clear(fees); await user.type(fees, f.fees);
    await user.click(screen.getByRole("button", { name: "Add paper position" }));
  }

  it("create → fee-aware P/L → update mark → remove", async () => {
    const user = userEvent.setup();
    render(<App />);
    await open(user, "Portfolio");
    await addPosition(user, { symbol: "abc", qty: "10", entry: "100.5", mark: "110.25", fees: "25" });
    expect(await screen.findByText(`${price(72.5)} (7.21% of entry cost)`)).toBeInTheDocument();
    expect(screen.getByText(/Entry .*100\.50 · Mark .*110\.25 · Fees .*25\.00/)).toBeInTheDocument(); // unit prices keep paise
    expect(JSON.parse(localStorage.getItem("finpilot-paper-positions") || "[]")[0]).toMatchObject({ symbol: "ABC", quantity: 10, markPrice: 110.25, fees: 25 });

    const markField = screen.getByLabelText("Update manual mark price ₹ for ABC");
    await user.clear(markField);
    expect(screen.queryByText(/-100\.00% of entry cost/)).not.toBeInTheDocument(); // clearing must not silently save a 0 mark
    await user.type(markField, "90{Enter}");
    expect(await screen.findByText(`${price(-130)} (-12.94% of entry cost)`)).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem("finpilot-paper-positions") || "[]")[0].markPrice).toBe(90);

    await user.click(screen.getByRole("button", { name: "Remove paper position ABC" }));
    expect(await screen.findByText(/No paper positions yet/)).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem("finpilot-paper-positions") || "[]")).toEqual([]);
  });

  it("uses the entry price when no mark is entered, and says so", async () => {
    const user = userEvent.setup();
    render(<App />);
    await open(user, "Portfolio");
    await addPosition(user, { symbol: "xyz", qty: "2", entry: "50", fees: "0" });
    expect(await screen.findByText(/entry price was used/)).toBeInTheDocument();
    expect(screen.getByText(`${price(0)} (0.00% of entry cost)`)).toBeInTheDocument();
  });

  it("rejects an empty or invalid position", async () => {
    const user = userEvent.setup();
    render(<App />);
    await open(user, "Portfolio");
    await user.click(screen.getByRole("button", { name: "Add paper position" }));
    expect(await screen.findByText(/Enter a symbol, positive quantity and entry price/)).toBeInTheDocument();
    expect(localStorage.getItem("finpilot-paper-positions")).toBeNull();
  });

  it("repairs saved positions that share or lack ids so removing one keeps the rest", async () => {
    localStorage.setItem("finpilot-paper-positions", JSON.stringify([
      { symbol: "AAA", quantity: 1, entryPrice: 10, markPrice: 10 },
      { symbol: "BBB", quantity: 1, entryPrice: 10, markPrice: 10 }
    ]));
    const user = userEvent.setup();
    render(<App />);
    await open(user, "Portfolio");
    await user.click(screen.getByRole("button", { name: "Remove paper position AAA" }));
    expect(screen.getByRole("button", { name: "Remove paper position BBB" })).toBeInTheDocument();
  });
});

describe("portfolio: personal asset tracker", () => {
  it("add → totals → export → clear → restore from backup (twice, without doubling)", async () => {
    const user = userEvent.setup();
    render(<App />);
    await open(user, "Portfolio");
    await user.type(screen.getByLabelText("Asset label"), "Savings");
    await user.type(screen.getByLabelText("Approximate value in rupees"), "50000");
    await user.click(screen.getByRole("button", { name: "Add entry" }));
    expect(await screen.findByText(money(50000), { selector: ".total-row b" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Export backup JSON" })).toBeEnabled();

    const backup = JSON.stringify({ holdings: [{ name: "Savings", amount: 50000, category: "Cash & deposits" }, { name: "Gold ETF", amount: 20000, category: "Gold / commodities" }] });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, new File([backup], "backup.json", { type: "application/json" }));
    expect(await screen.findByText(/Imported 1 new entry, skipped 1 already present/)).toBeInTheDocument();
    expect(screen.getByText(money(70000), { selector: ".total-row b" })).toBeInTheDocument();

    await user.upload(input, new File([backup], "backup.json", { type: "application/json" }));
    await waitFor(() => expect(screen.getByText(/Imported 0 new entries, skipped 2 already present/)).toBeInTheDocument());
    expect(screen.getByText(money(70000), { selector: ".total-row b" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Clear local entries" }));
    expect(await screen.findByText(/No entries yet/)).toBeInTheDocument();
  });

  it("rejects invalid backup files with a readable message", async () => {
    const user = userEvent.setup();
    render(<App />);
    await open(user, "Portfolio");
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, new File(["{not json"], "bad.json", { type: "application/json" }));
    expect(await screen.findByText("This file is not valid JSON.")).toBeInTheDocument();
  });

  it("shows recorded assets on the Overview (cross-module link)", async () => {
    localStorage.setItem("finpilot-holdings", JSON.stringify([{ name: "Cash", amount: 1234, category: "Cash & deposits" }]));
    render(<App />);
    expect(await screen.findByText(money(1234))).toBeInTheDocument();
    expect(screen.getByText(/1 entry · your own notes, not verified/)).toBeInTheDocument();
  });
});

describe("news intelligence", () => {
  it("groups headlines, counts publishers correctly and never renders unsafe links", async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByText("Public data snapshots available");
    await open(user, "News Intelligence");
    expect(await screen.findByText("2 items · 1 publisher domain · 2 official-source items")).toBeInTheDocument();
    expect(document.querySelector('a[href^="javascript:"]')).toBeNull();
    expect(screen.queryByText("Malicious link item")).not.toBeInTheDocument();
    expect(screen.getAllByRole("link").some(a => a.getAttribute("href") === "https://rbi.org.in/pr/2")).toBe(true);
    expect(screen.getByText(/not by a verified event identity/)).toBeInTheDocument();
  });
});

describe("AI mentor (rules-based)", () => {
  it("answers a beginner question on topic and labels itself as non-generative", async () => {
    const user = userEvent.setup();
    render(<App />);
    await open(user, "AI Mentor");
    await user.type(screen.getByLabelText("Ask FinPilot learning assistant"), "How do I start investing in mutual funds?");
    await user.click(screen.getByRole("button", { name: /Ask FinPilot/ }));
    expect(await screen.findByText(/A SIP is a way to invest a fixed amount/)).toBeInTheDocument();
    expect(screen.queryByText(/do not force an SIP/)).not.toBeInTheDocument();
    expect(screen.getAllByText(/not a generative AI|not generated by an LLM/i).length).toBeGreaterThan(0);
  });
});

describe("markets and research inputs", () => {
  it("validates the chart symbol format", async () => {
    const user = userEvent.setup();
    render(<App />);
    await open(user, "Markets");
    const symbol = screen.getByLabelText(/Symbol \(EXCHANGE:TICKER\)/);
    await user.clear(symbol);
    await user.type(symbol, "NIFTY");
    await user.click(screen.getByRole("button", { name: /Load chart/ }));
    expect(await screen.findByText(/Use EXCHANGE:TICKER format/)).toBeInTheDocument();
  });

  it("flags a non-HTTPS research source", async () => {
    const user = userEvent.setup();
    render(<App />);
    await open(user, "Opportunities");
    await user.type(screen.getByLabelText("Primary source HTTPS URL"), "http://example.com/doc");
    expect(await screen.findByText(/Add an HTTPS link to the original offer document/)).toBeInTheDocument();
  });
});
