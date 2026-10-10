"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, Upload } from "lucide-react";
import { PageFade } from "@/components/PageFade";
import { getPipeline, setPipeline, updateStage, removeFromPipeline, STAGES, PipelineEntry, PipelineStage } from "@/lib/pipeline";

export default function PipelinePage() {
  const [entries, setEntries] = useState<PipelineEntry[]>([]);

  useEffect(() => setEntries(getPipeline()), []);

  const move = (ticker: string, stage: PipelineStage) => {
    updateStage(ticker, stage);
    setEntries(getPipeline());
  };

  const remove = (ticker: string) => {
    removeFromPipeline(ticker);
    setEntries(getPipeline());
  };

  const exportCsv = () => {
    const lines = ["Ticker,Name,Stage,Added"];
    entries.forEach((e) => lines.push(`${e.ticker},"${e.name}",${e.stage},${e.addedAt.slice(0, 10)}`));
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "dealflow_pipeline.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify({ app: "dealflow", version: 1, pipeline: entries }, null, 1)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "dealflow_pipeline.json"; a.click();
    URL.revokeObjectURL(url);
  };
  const importJson = async (file: File | undefined) => {
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      const list: PipelineEntry[] = (data.pipeline ?? data).filter((e: PipelineEntry) => e && typeof e.ticker === "string" && typeof e.stage === "string");
      const merged = [...getPipeline()];
      list.forEach((e) => { if (!merged.some((m) => m.ticker === e.ticker)) merged.push({ ticker: e.ticker, name: e.name || e.ticker, stage: e.stage, addedAt: e.addedAt || new Date().toISOString() }); });
      setPipeline(merged);
      setEntries(getPipeline());
    } catch { alert("That file is not a DealFlow pipeline export."); }
  };

  return (
    <PageFade>
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="font-serif text-3xl text-ink mb-2">Your pipeline</h1>
          <p className="text-dim text-[12px]">Saved locally in this browser. Add companies from any company page.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <label className="border border-line px-3 py-2 text-[12px] text-dim hover:text-ink hover:border-signal transition-colors flex items-center gap-1.5 cursor-pointer">
            <Upload size={13} />Import JSON
            <input type="file" accept="application/json,.json" className="sr-only" onChange={(e) => { importJson(e.target.files?.[0]); e.target.value = ""; }} />
          </label>
          {entries.length > 0 && (
            <button onClick={exportJson}
              className="border border-line px-3 py-2 text-[12px] text-dim hover:text-ink hover:border-signal transition-colors flex items-center gap-1.5">
              <Download size={13} />Backup JSON
            </button>
          )}
        {entries.length > 0 && (
          <button
            onClick={exportCsv}
            className="border border-line px-3 py-2 text-[12px] text-dim hover:text-ink hover:border-signal transition-colors flex items-center gap-1.5"
          >
            <Download size={13} />
            Export CSV
          </button>
        )}
        </div>
      </div>

      {entries.length === 0 && (
        <p className="text-dim text-[13px] py-16 text-center">
          Nothing here yet. Open any company and click &quot;Add to pipeline&quot; to start tracking it.
        </p>
      )}

      {entries.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
          {STAGES.map((stage) => {
            const items = entries.filter((e) => e.stage === stage.id);
            return (
              <div key={stage.id} className="border border-line">
                <div className="px-3 py-2.5 border-b border-line text-[11px] text-dim uppercase tracking-wide flex justify-between">
                  {stage.label}
                  <span>{items.length}</span>
                </div>
                <div className="p-2 space-y-2 min-h-[80px]">
                  <AnimatePresence>
                    {items.map((e) => (
                      <motion.div
                        key={e.ticker}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-surface border border-line p-2.5"
                      >
                        <div className="flex items-start justify-between gap-1 mb-2">
                          <Link href={`/company/${e.ticker}`} className="focus-ring">
                            <div className="text-ink text-[13px] hover:text-signal transition-colors">{e.ticker}</div>
                            <div className="text-dim text-[10px]">{e.name}</div>
                          </Link>
                          <button onClick={() => remove(e.ticker)} className="text-dim hover:text-down transition-colors">
                            <X size={13} />
                          </button>
                        </div>
                        <select
                          value={e.stage}
                          onChange={(ev) => move(e.ticker, ev.target.value as PipelineStage)}
                          className="w-full bg-bg border border-line text-[10px] text-dim px-1.5 py-1 focus-ring"
                        >
                          {STAGES.map((s) => (
                            <option key={s.id} value={s.id}>{s.label}</option>
                          ))}
                        </select>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </PageFade>
  );
}