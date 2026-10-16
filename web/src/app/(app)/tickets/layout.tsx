import type { Metadata } from "next";
import { t } from "@/lib/strings.fa";

// Only sets the browser tab title; the page itself is a client component and cannot export metadata.
export const metadata: Metadata = { title: t.nav.tickets };

export default function TicketsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
