export const fmtMoney = (n: number | null | undefined, digits = 1): string => {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  const abs = Math.abs(n);
  if (abs >= 1e12) return `$${(n / 1e12).toFixed(digits)}T`;
  if (abs >= 1e9) return `$${(n / 1e9).toFixed(digits)}B`;
  if (abs >= 1e6) return `$${(n / 1e6).toFixed(digits)}M`;
  return `$${n.toFixed(2)}`;
};
export const fmtPrice = (n: number | null | undefined): string =>
  n === null || n === undefined || Number.isNaN(n) ? "—" : `$${n.toFixed(2)}`;
export const fmtPct = (n: number | null | undefined, digits = 1): string =>
  n === null || n === undefined || Number.isNaN(n) ? "—" : `${(n * 100).toFixed(digits)}%`;
export const fmtX = (n: number | null | undefined, digits = 1): string =>
  n === null || n === undefined || Number.isNaN(n) ? "—" : `${n.toFixed(digits)}x`;
