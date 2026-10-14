"use client";

import { useState } from "react";
import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toast } from "@heroui/react";
import { ApiError } from "@/lib/api-client";

function redirectOn401(error: unknown) {
  if (error instanceof ApiError && error.status === 401 && window.location.pathname !== "/login") {
    // A full page load on purpose: it also throws away every cached query. ESLint warns about it, so we silence that one rule.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = "/login";
  }
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({ onError: redirectOn401 }),
        mutationCache: new MutationCache({ onError: redirectOn401 }),
        defaultOptions: {
          queries: { staleTime: 5_000, retry: false, refetchOnWindowFocus: false },
        },
      }),
  );

  return (
    <QueryClientProvider client={client}>
      {children}
      <Toast.Provider />
    </QueryClientProvider>
  );
}
