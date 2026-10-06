"use client";
import { useEffect, useState } from "react";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { addToPipeline, isInPipeline, removeFromPipeline } from "@/lib/pipeline";

export function PipelineButton({ ticker, name }: { ticker: string; name: string }) {
  const [added, setAdded] = useState(false);

  useEffect(() => setAdded(isInPipeline(ticker)), [ticker]);

  const toggle = () => {
    if (added) {
      removeFromPipeline(ticker);
      setAdded(false);
    } else {
      addToPipeline(ticker, name);
      setAdded(true);
    }
  };

  return (
    <button
      onClick={toggle}
      className="border border-line px-3 py-1 text-[11px] text-dim hover:text-ink hover:border-signal transition-colors focus-ring flex items-center gap-1.5"
    >
      {added ? <BookmarkCheck size={12} className="text-signal" /> : <Bookmark size={12} />}
      <span className="hidden sm:inline">{added ? "In pipeline" : "Add to pipeline"}</span>
    </button>
  );
}