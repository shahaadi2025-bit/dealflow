export function timeAgo(iso: string | null | undefined, now: number = Date.now()): string {
  if (!iso) return "";
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "";
  const s = Math.max(0, Math.round((now - t) / 1000));
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export function fmtDealValue(musd: number | null | undefined): string {
  if (musd === null || musd === undefined) return "";
  if (musd >= 1000) return `$${(musd / 1000).toFixed(musd >= 10000 ? 0 : 1)}B`;
  return `$${Math.round(musd)}M`;
}
