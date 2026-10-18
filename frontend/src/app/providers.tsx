"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new QueryClient({ defaultOptions: { queries: { staleTime: 60_000, retry: 1 } } }));
  // Wake the free-tier API (cold start can take ~30s) as soon as the site opens, before the first real request.
  useEffect(() => { api.dataHealth().catch(() => undefined); }, []);
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}