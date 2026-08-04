"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useRef } from "react";

/**
 * Wraps the app in TanStack Query's QueryClientProvider.
 * Must be a separate client component because layout.tsx is a server component.
 */
export default function QueryProvider({ children }: { children: React.ReactNode }) {
  // useRef so the QueryClient is created once per component lifetime,
  // not recreated on every render.
  const queryClientRef = useRef<QueryClient | null>(null);
  if (queryClientRef.current === null) {
    queryClientRef.current = new QueryClient({
      defaultOptions: {
        queries: {
          // Don't retry failed requests automatically — the polling hook
          // controls its own refetch cadence.
          retry: false,
          // Keep data fresh while the window is focused.
          refetchOnWindowFocus: false,
        },
      },
    });
  }

  return (
    <QueryClientProvider client={queryClientRef.current}>
      {children}
    </QueryClientProvider>
  );
}
