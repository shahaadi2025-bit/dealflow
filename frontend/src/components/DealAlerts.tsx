"use client";
import { useEffect, useState } from "react";
import { X, Bell } from "lucide-react";
import { api } from "@/lib/api";
import { getRules, getSeen, newMatches, setSeen } from "@/lib/alerts";

type Toast = { link: string; title: string };

/** Polls the deal wire while the site is open and surfaces deals matching the user's watch rules. */
export function DealAlerts() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  useEffect(() => {
    let stop = false;
    const check = async () => {
      const rules = getRules();
      if (!rules.length || document.hidden) return;
      try {
        const data = await api.liveDeals(undefined, 1);
        const seen = getSeen();
        const first = seen.length === 0;
        const fresh = newMatches(rules, data.items, seen);
        setSeen([...seen, ...data.items.map((i) => i.link)]);
        if (stop || first || !fresh.length) return;
        setToasts((t) => [...fresh.slice(0, 3).map((f) => ({ link: f.link, title: f.title })), ...t].slice(0, 4));
        if (typeof Notification !== "undefined" && Notification.permission === "granted") {
          fresh.slice(0, 2).forEach((f) => new Notification("DealFlow: new deal", { body: f.title }));
        }
      } catch { /* try again next tick */ }
    };
    const id = setInterval(check, 90_000);
    const t0 = setTimeout(check, 4000);
    return () => { stop = true; clearInterval(id); clearTimeout(t0); };
  }, []);
  if (!toasts.length) return null;
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-[340px]" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.link} className="glass p-3 flex gap-2 items-start shadow-xl">
          <Bell size={14} className="text-signal mt-0.5 shrink-0" />
          <a href={t.link} target="_blank" rel="noopener noreferrer" className="text-[12px] text-ink hover:text-signal leading-snug flex-1">{t.title}</a>
          <button aria-label="Dismiss" onClick={() => setToasts((x) => x.filter((y) => y.link !== t.link))} className="text-dim hover:text-ink"><X size={13} /></button>
        </div>
      ))}
    </div>
  );
}
