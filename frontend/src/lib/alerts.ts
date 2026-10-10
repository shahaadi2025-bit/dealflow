export type AlertRule = { id: string; label: string; ticker?: string; sector?: string; minValueMusd?: number; keyword?: string };
const RULES = "dealflow:alert-rules";
const SEEN = "dealflow:alert-seen";

export function getRules(): AlertRule[] {
  try { return JSON.parse(localStorage.getItem(RULES) || "[]"); } catch { return []; }
}
export function setRules(r: AlertRule[]) {
  try { localStorage.setItem(RULES, JSON.stringify(r)); window.dispatchEvent(new Event("dealflow:alerts-changed")); } catch { /* storage unavailable */ }
}
export function getSeen(): string[] {
  try { return JSON.parse(localStorage.getItem(SEEN) || "[]"); } catch { return []; }
}
export function setSeen(s: string[]) {
  try { localStorage.setItem(SEEN, JSON.stringify(s.slice(-400))); } catch { /* ignore */ }
}

type Item = { link: string; title: string; tickers: string[]; sectors: string[]; deal?: { value_musd: number | null } | null };

export function matches(rule: AlertRule, it: Item): boolean {
  if (rule.ticker && !it.tickers.includes(rule.ticker.toUpperCase())) return false;
  if (rule.sector && !it.sectors.includes(rule.sector)) return false;
  if (rule.minValueMusd && (it.deal?.value_musd ?? 0) < rule.minValueMusd) return false;
  if (rule.keyword && !it.title.toLowerCase().includes(rule.keyword.toLowerCase())) return false;
  return true;
}

/** Items matching any rule that the user has not been told about yet. */
export function newMatches(rules: AlertRule[], items: Item[], seen: string[]): Item[] {
  const s = new Set(seen);
  return items.filter((i) => !s.has(i.link) && rules.some((r) => matches(r, i)));
}
