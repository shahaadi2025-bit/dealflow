const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Request failed (${res.status})`);
  }
  return res.json();
}

export type Driver = { label: string; points: number; value: number };
export type ScreenRow = {
  ticker: string; name: string; price: number; market_cap: number;
  growth: number; gross_margin: number; fcf_margin: number; rule_of_40: number;
  ev_rev: number; score: number; drivers: Driver[]; method: string;
};
export type Company = {
  ticker: string; name: string; price: number; market_cap: number; shares: number;
  revenue: number | null; rev_growth: number | null; gross_margin: number | null;
  ebitda: number | null; fcf: number | null; debt: number; cash: number; beta: number | null;
  hi52: number | null; lo52: number | null; history: { year: number; revenue: number }[];
  as_of: string; net_debt: number; ev: number; gross_profit: number | null;
  fcf_margin: number | null; ebitda_margin: number | null; sector?: string;
  price_history?: { date: string; close: number }[];
};
export type FootballBar = { key: string; label: string; low: number; high: number; kind: string };
export type Valuation = {
  company: Company;
  assumptions: {
    growth_path: number[]; growth_start: number; growth_end: number; fcf_margin_start: number;
    fcf_margin_target: number; wacc: number; terminal_g: number; premium_low: number; premium_high: number; beta: number;
  };
  dcf: { ev: number; equity: number; per_share: number; tv_share: number | null; fcfs: number[] };
  sensitivity: { waccs: number[]; tgs: number[]; grid: (number | null)[][] };
  comps: {
    peers: { ticker: string; name: string; market_cap: number; ev_rev: number | null; ev_gp: number | null; ev_ebitda: number | null }[];
    stats: Record<string, { p25: number; p50: number; p75: number; n: number } | null>;
    implied: Record<string, { low: number; mid: number; high: number } | null>;
    excluded: { ticker: string; name: string; reason: string }[];
  };
  football: FootballBar[];
  offer: { low: number; high: number };
};
export type SectorStats = {
  sector: string; company_count: number; median_growth: number | null;
  median_gross_margin: number | null; median_fcf_margin: number | null;
  median_rule_of_40: number | null; median_ev_rev: number | null;
};

export type SimilarCompany = { ticker: string; name: string; distance: number; growth: number; gross_margin: number; ev_rev: number };
export type HistoricalDeal = { ticker: string; ev_rev: number; growth: number; confidence: string; note: string };

export type Memo = {
  executive_summary: string; business_overview: string; financial_analysis: string;
  valuation_summary: string; key_risks: string; recommendation: string; _grounded?: boolean;
};

export type Sentiment = { score: number; label: "bullish" | "bearish" | "neutral" };
export type DealMeta = {
  status: "announced" | "rumor" | "completed" | "terminated"; type: string;
  value_musd: number | null; acquirer: string | null; target: string | null;
};
export type NewsItem = {
  title: string; link: string; source: string; published: string | null; summary: string;
  sentiment: Sentiment; tags: string[]; tickers: string[]; sectors: string[];
  is_deal: boolean; deal?: DealMeta; also_reported_by: string[]; age_minutes: number | null;
};
export type Mood = { score: number; label: "bullish" | "bearish" | "neutral"; bullish: number; bearish: number; neutral: number };
export type NewsResponse = { updated: string; count: number; items: NewsItem[]; mood: Mood; ticker?: string };
export type LiveDeals = {
  updated: string; days: number; count: number; items: NewsItem[];
  stats: { by_sector: { sector: string; count: number }[]; disclosed_value_musd: number; status: Record<string, number> };
};
export type SecFiling = {
  form: string; form_label: string; company: string; role: string | null; link: string;
  published: string | null; age_minutes: number | null;
};
export type TapeItem = { symbol: string; label: string; price: number; change_pct: number };

export const api = {
  sectors: () => req<{ sectors: string[] }>("/sectors"),
  screen: (params: Record<string, string | number | undefined>) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== "") as [string, string][]
    );
    return req<{ sector: string; results: ScreenRow[] }>(`/screen?${qs.toString()}`);
  },
  screenCustom: (tickers: string[]) =>
    req<{ sector: string; results: ScreenRow[] }>("/screen/custom", {
      method: "POST",
      body: JSON.stringify({ tickers }),
    }),
  company: (ticker: string) => req<Company>(`/company/${ticker}`),
  valuate: (ticker: string, overrides: Record<string, unknown> = {}) =>
    req<Valuation>(`/valuate/${ticker}`, { method: "POST", body: JSON.stringify(overrides) }),
  memo: (valuation: Valuation, screening?: ScreenRow, thesisNote?: string) =>
    req<{ memo: Memo; company_name: string }>("/memo", {
      method: "POST",
      body: JSON.stringify({ valuation, screening, thesis_note: thesisNote }),
    }),
  memoPdfUrl: () => `${BASE}/memo/pdf`,
  reportPdfUrl: (ticker: string) => `${BASE}/valuate/${ticker}/report`,
  searchTickers: (q: string) => req<{ results: { ticker: string; name: string }[] }>(`/tickers/search?q=${encodeURIComponent(q)}`),
  sectorStats: () => req<{ sectors: SectorStats[] }>("/sectors/stats"),
  similarCompanies: (ticker: string) =>
    req<{ ticker: string; results: SimilarCompany[] }>(`/company/${ticker}/similar`),
  newsMarket: (params: Record<string, string | number | boolean | undefined> = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== "" && v !== false).map(([k, v]) => [k, String(v)]) as [string, string][]
    );
    return req<NewsResponse>(`/news/market?${qs.toString()}`);
  },
  newsTicker: (ticker: string) => req<NewsResponse>(`/news/ticker/${encodeURIComponent(ticker)}`),
  newsTrending: () => req<{ updated: string; tickers: { ticker: string; mentions: number; sentiment: number }[] }>("/news/trending"),
  liveDeals: (sector?: string, days = 7) =>
    req<LiveDeals>(`/deals/live?days=${days}${sector ? `&sector=${encodeURIComponent(sector)}` : ""}`),
  dealFilings: () => req<{ updated: string; count: number; items: SecFiling[] }>("/deals/filings"),
  marketTape: () => req<{ updated: string | null; items: TapeItem[] }>("/market/tape"),
  deals: () => req<{ deals: HistoricalDeal[] }>("/deals"),
  createCheckoutSession: () => req<{ url: string }>("/billing/create-checkout-session", { method: "POST" }),
  verifySession: (sessionId: string) => req<{ paid: boolean }>(`/billing/verify-session?session_id=${encodeURIComponent(sessionId)}`),
};