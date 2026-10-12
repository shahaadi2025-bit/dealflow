"use client";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, XCircle } from "lucide-react";
import { PageFade } from "@/components/PageFade";
import { api } from "@/lib/api";

export default function StatusPage() {
  const h = useQuery({ queryKey: ["feed-health"], queryFn: () => api.feedHealth(), retry: false, refetchInterval: 60_000 });
  const d = useQuery({ queryKey: ["data-health"], queryFn: () => api.dataHealth(), retry: false });
  return (
    <PageFade>
      <h1 className="font-serif text-3xl text-ink mb-1.5">System status</h1>
      <p className="text-dim text-[12px] mb-6 max-w-xl">Checks each live data source from the server. If a feed is down DealFlow falls back to cached data and the committed snapshot.</p>
      {h.isLoading && <p className="text-dim text-[12px]">Probing feeds (can take ~15s if the server is waking up)...</p>}
      {h.isError && <p className="text-down text-[12px]">Could not reach the API. It may be waking up; retry in a minute.</p>}
      {h.data && (
        <div className="glass divide-y divide-line/50 mb-6 max-w-xl">
          {Object.entries(h.data.sources).map(([k, v]) => (
            <div key={k} className="flex items-center gap-3 px-4 py-2.5 text-[12.5px]">
              {v.ok ? <CheckCircle2 size={15} className="text-up" /> : <XCircle size={15} className="text-down" />}
              <span className="text-ink capitalize w-28">{k.replace("_", " ")}</span>
              <span className="text-dim flex-1 truncate">{v.ok ? `${v.items ?? ""} items` : v.error}</span>
              <span className="text-dim tabular-nums">{v.ms}ms</span>
            </div>
          ))}
        </div>
      )}
      {d.data && (
        <p className="text-dim text-[12px]">Snapshot: {d.data.companies} companies, as of {d.data.snapshot_as_of ?? "unknown"}. Archived deals: {d.data.deals_history}.</p>
      )}
    </PageFade>
  );
}
