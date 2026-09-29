export function ScoreBar({ score }: { score: number }) {
  const pct = Math.max(0, Math.min(100, score));
  return (
    <div className="flex items-center gap-2 min-w-[110px]">
      <div className="h-1.5 flex-1 bg-line">
        <div className="h-full bg-signal" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-signal font-medium tabular-nums w-9 text-right">{score.toFixed(0)}</span>
    </div>
  );
}
