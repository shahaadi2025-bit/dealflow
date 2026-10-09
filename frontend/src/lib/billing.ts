const KEY = "dealflow:pro";

export function isPro(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(KEY) === "true";
}

export function setPro(value: boolean) {
  if (value) localStorage.setItem(KEY, "true");
  else localStorage.removeItem(KEY);
  window.dispatchEvent(new Event("dealflow:pro-changed"));
}

// Empty for now -- everything is free. Add sector keys back here to re-enable gating later.
export const PRO_ONLY_SECTORS: string[] = [];