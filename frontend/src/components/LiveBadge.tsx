"use client";
import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { timeAgo } from "@/lib/time";

export function LiveBadge({ updated, fetching, onRefresh, live = true }: {
  updated?: string | null; fetching?: boolean; onRefresh?: () => void; live?: boolean;
}) {
  const [, tick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 15000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="flex items-center gap-2.5 text-[11px] text-dim">
      <span className="flex items-center gap-1.5">
        <span className={`live-dot ${live ? "" : "off"}`} />
        <span className="text-ink">{live ? "Live" : "Paused"}</span>
      </span>
      {updated && <span>updated {timeAgo(updated)}</span>}
      {onRefresh && (
        <button
          onClick={onRefresh}
          aria-label="Refresh now"
          className="border border-line p-1 hover:border-signal hover:text-ink transition-colors focus-ring"
        >
          <RefreshCw size={11} className={fetching ? "animate-spin" : ""} />
        </button>
      )}
    </div>
  );
}
