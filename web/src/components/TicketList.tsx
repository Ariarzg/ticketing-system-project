"use client";

import Link from "next/link";
import { Avatar, Skeleton } from "@heroui/react";
import { ATTENTION_STATUSES } from "@/lib/constants";
import { formatRelative } from "@/lib/dates";
import type { TicketDto } from "@/lib/hooks/use-tickets";
import { initials } from "@/lib/initials";
import { t } from "@/lib/strings.fa";
import { PriorityChip, StatusChip } from "./chips";

/**
 * One row per ticket. The whole row is the link, so it works with keyboard and touch.
 * Rows that wait for an agent get an accent bar on the start edge (and screen-reader text),
 * so they stand out without shouting.
 */
export function TicketList({
  tickets,
  showAuthor = false,
  highlightAttention = false,
  empty,
}: {
  tickets: TicketDto[];
  showAuthor?: boolean;
  highlightAttention?: boolean;
  empty?: React.ReactNode;
}) {
  if (tickets.length === 0) {
    return <div className="rounded-2xl border border-border bg-surface">{empty}</div>;
  }

  return (
    <ul className="divide-y divide-separator overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--surface-shadow)]">
      {tickets.map((ticket, index) => {
        const needsAttention =
          highlightAttention && (ATTENTION_STATUSES as readonly string[]).includes(ticket.status);
        return (
          <li key={ticket.id} className="rise" style={{ "--i": Math.min(index, 8) } as React.CSSProperties}>
            <Link
              href={`/tickets/${ticket.id}`}
              className={`group flex flex-col gap-2 border-s-[3px] px-4 py-3.5 transition-colors hover:bg-surface-secondary focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent sm:flex-row sm:items-center sm:gap-4 ${
                needsAttention ? "border-s-accent" : "border-s-transparent"
              }`}
            >
              <div className="min-w-0 flex-1">
                <p dir="auto" className={`truncate ${needsAttention ? "font-bold" : "font-medium"}`}>
                  {needsAttention && <span className="sr-only">{t.tickets.needsAttention}: </span>}
                  {ticket.title}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                  {showAuthor && (
                    <span className="inline-flex items-center gap-1.5">
                      <Avatar size="sm" className="size-5 text-[10px]">
                        <Avatar.Fallback>{initials(ticket.authorName)}</Avatar.Fallback>
                      </Avatar>
                      {ticket.authorName}
                    </span>
                  )}
                  {showAuthor && <span>{t.department[ticket.department]}</span>}
                  <time dateTime={ticket.updatedAt}>{formatRelative(ticket.updatedAt)}</time>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <PriorityChip priority={ticket.priority} />
                <StatusChip status={ticket.status} />
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** Same shape as a real row, shown while the list loads. */
export function TicketListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="divide-y divide-separator overflow-hidden rounded-2xl border border-border bg-surface">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-4">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-2/3 rounded-lg" />
            <Skeleton className="h-3 w-1/3 rounded-lg" />
          </div>
          <Skeleton className="h-6 w-14 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}