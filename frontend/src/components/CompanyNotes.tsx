"use client";
import { useEffect, useRef, useState } from "react";
import { StickyNote, Check } from "lucide-react";

export function CompanyNotes({ ticker }: { ticker: string }) {
  const key = `dealflow:notes:${ticker}`;
  const [value, setValue] = useState("");
  const [saved, setSaved] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setValue(localStorage.getItem(key) || "");
    setSaved(true);
  }, [key]);

  const onChange = (v: string) => {
    setValue(v);
    setSaved(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (v.trim()) localStorage.setItem(key, v);
      else localStorage.removeItem(key);
      setSaved(true);
    }, 500);
  };

  return (
    <div className="border border-line p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-dim text-[11px]">
          <StickyNote size={13} />
          Your notes on {ticker} (saved locally in this browser only)
        </div>
        {saved && value && <span className="text-up text-[10px] flex items-center gap-1"><Check size={11} /> Saved</span>}
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Thesis, questions, things to check before deciding..."
        rows={4}
        className="w-full bg-surface border border-line px-3 py-2 text-ink placeholder:text-dim/60 text-[12px] leading-relaxed focus-ring resize-y"
      />
    </div>
  );
}