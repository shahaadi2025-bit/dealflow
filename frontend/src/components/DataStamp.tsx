"use client";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function DataStamp() {
  const { data } = useQuery({ queryKey: ["data-health"], queryFn: () => api.dataHealth(), staleTime: 600_000, retry: false });
  if (!data) return null;
  return (
    <span className="block mt-1 text-dim/80">
      Fundamentals snapshot: {data.snapshot_as_of ?? "n/a"} ({data.companies} companies). Prices, news and deals refresh live.
    </span>
  );
}
