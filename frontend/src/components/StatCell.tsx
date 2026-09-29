export function StatCell({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="border border-line p-4">
      <div className="text-dim text-[11px] mb-1.5">{label}</div>
      <div className="font-serif text-2xl text-ink">{value}</div>
      {sub && <div className="text-dim text-[11px] mt-1">{sub}</div>}
    </div>
  );
}
