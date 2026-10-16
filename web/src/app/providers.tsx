"use client";

import { useState } from "react";
import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { I18nProvider, Toast } from "@heroui/react";
import { IconContext } from "@phosphor-icons/react";
import { ApiError } from "@/lib/api-client";

// Every icon sits next to a text or inside a labelled button, so screen readers should skip it.
const iconDefaults = { "aria-hidden": true } as const;

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

  // React Aria (under HeroUI) takes its direction from the browser language unless told otherwise.
  // Without this, an English browser gets left-to-right toasts and popovers and reversed arrow keys.
  return (
    <I18nProvider locale="fa-IR">
      <IconContext.Provider value={iconDefaults}>
        <QueryClientProvider client={client}>
          {children}
          <Toast.Provider />
        </QueryClientProvider>
      </IconContext.Provider>
    </I18nProvider>
  );
}
