export type PipelineStage = "watching" | "researching" | "shortlisted" | "passed";

export type PipelineEntry = {
  ticker: string;
  name: string;
  stage: PipelineStage;
  addedAt: string;
};

const KEY = "dealflow:pipeline";

export const STAGES: { id: PipelineStage; label: string }[] = [
  { id: "watching", label: "Watching" },
  { id: "researching", label: "Researching" },
  { id: "shortlisted", label: "Shortlisted" },
  { id: "passed", label: "Passed" },
];

export function getPipeline(): PipelineEntry[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function setPipeline(entries: PipelineEntry[]) {
  localStorage.setItem(KEY, JSON.stringify(entries));
  if (typeof window !== "undefined") window.dispatchEvent(new Event("dealflow:pipeline-changed"));
}

export function addToPipeline(ticker: string, name: string, stage: PipelineStage = "watching") {
  const cur = getPipeline();
  if (cur.some((e) => e.ticker === ticker)) return;
  cur.push({ ticker, name, stage, addedAt: new Date().toISOString() });
  setPipeline(cur);
}

export function updateStage(ticker: string, stage: PipelineStage) {
  const cur = getPipeline();
  const next = cur.map((e) => (e.ticker === ticker ? { ...e, stage } : e));
  setPipeline(next);
}

export function removeFromPipeline(ticker: string) {
  setPipeline(getPipeline().filter((e) => e.ticker !== ticker));
}

export function isInPipeline(ticker: string): boolean {
  return getPipeline().some((e) => e.ticker === ticker);
}