export type SharedMemo = { company: string; memo: Record<string, string> };

function b64(s: string): string {
  const bytes = new TextEncoder().encode(s);
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function unb64(s: string): string {
  const pad = s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4);
  const bin = atob(pad);
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

/** The memo travels inside the URL fragment: nothing is stored on any server. */
export function encodeMemo(m: SharedMemo): string {
  return `/memo#d=${b64(JSON.stringify(m))}`;
}
export function decodeMemo(hash: string): SharedMemo | null {
  try {
    const m = /d=([^&]+)/.exec(hash);
    if (!m) return null;
    const v = JSON.parse(unb64(m[1]));
    return v && typeof v.company === "string" && v.memo ? v : null;
  } catch { return null; }
}
