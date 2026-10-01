"use client";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Download, Loader2, AlertTriangle } from "lucide-react";
import { Memo } from "@/lib/api";

const SECTIONS: { key: keyof Memo; label: string }[] = [
  { key: "executive_summary", label: "Executive summary" },
  { key: "business_overview", label: "Business overview" },
  { key: "financial_analysis", label: "Financial analysis" },
  { key: "valuation_summary", label: "Valuation summary" },
  { key: "key_risks", label: "Key risks" },
  { key: "recommendation", label: "Recommendation" },
];

export function MemoPanel({ onGenerate, isPending, isError, error, memo, companyName }: {
  onGenerate: () => void; isPending: boolean; isError: boolean; error: Error | null;
  memo?: Memo; companyName: string;
}) {
  const downloadPdf = async () => {
    if (!memo) return;
    const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const res = await fetch(`${base}/memo/pdf`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ company_name: companyName, memo }),
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${companyName.replace(/\s+/g, "_")}_memo.pdf`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.4 }}
      className="border border-line p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles size={15} className="text-signal" />
          <div>
            <div className="text-ink text-[13px]">Investment memo</div>
            <div className="text-dim text-[11px] mt-1">
              Generated from the numbers above - the model writes prose, it doesn&apos;t invent figures.
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {memo && (
            <button onClick={downloadPdf} className="border border-line px-4 py-2 text-[12px] text-ink hover:border-signal transition-colors focus-ring flex items-center gap-1.5">
              <Download size={13} />
              Download PDF
            </button>
          )}
          <button onClick={onGenerate} disabled={isPending}
            className="bg-signal text-bg px-4 py-2 text-[12px] font-medium hover:opacity-90 transition-opacity disabled:opacity-50 focus-ring flex items-center gap-1.5">
            {isPending ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
            {isPending ? "Drafting..." : memo ? "Regenerate memo" : "Generate memo"}
          </button>
        </div>
      </div>

      {isError && (
        <p className="text-down text-[12px] mb-3 flex items-center gap-1.5">
          <AlertTriangle size={13} />
          {error?.message || "Couldn't generate the memo."} If this says the API key is missing, the backend needs GROQ_API_KEY set.
        </p>
      )}

      <AnimatePresence>
        {memo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="space-y-5 mt-2"
          >
            {memo._grounded === false && (
              <p className="text-signal text-[11px] border border-signal/40 px-3 py-2">
                Note: some figures in this draft couldn&apos;t be verified against the computed data. Review before relying on it.
              </p>
            )}
            {SECTIONS.map(({ key, label }, i) => (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.06 }}
              >
                <div className="text-dim text-[11px] mb-1.5 uppercase tracking-wide">{label}</div>
                <p className="font-serif text-ink leading-relaxed text-[14px]">{memo[key] as string}</p>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}