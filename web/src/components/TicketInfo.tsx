import Link from "next/link";
import { Avatar } from "@heroui/react";
import { formatDate } from "@/lib/dates";
import type { MeUser } from "@/lib/hooks/use-me";
import type { TicketDto } from "@/lib/hooks/use-tickets";
import { initials } from "@/lib/initials";
import { t } from "@/lib/strings.fa";
import { DepartmentChip, PriorityChip, StatusChip } from "./chips";
import { StatusControl } from "./StatusControl";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="text-sm">{children}</dd>
    </div>
  );
}

/** The side panel of a ticket: its facts, and for agents the status buttons. */
export function TicketInfo({ ticket, me }: { ticket: TicketDto; me: MeUser }) {
  const isAgent = me.role === "agent";
  return (
    <aside className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-4 shadow-[var(--surface-shadow)]">
      <dl className="divide-y divide-separator">
        <Row label={t.tickets.colStatus}>
          <StatusChip status={ticket.status} />
        </Row>
        <Row label={t.tickets.colPriority}>
          <PriorityChip priority={ticket.priority} />
        </Row>
        <Row label={t.tickets.colDepartment}>
          <DepartmentChip department={ticket.department} />
        </Row>
        <Row label={t.tickets.colAuthor}>
          {isAgent ? (
            <Link href={`/users/${ticket.authorSlug}`} className="inline-flex items-center gap-2 font-medium hover:underline">
              <Avatar size="sm" className="size-6 text-[10px]">
                <Avatar.Fallback>{initials(ticket.authorName)}</Avatar.Fallback>
              </Avatar>
              {ticket.authorName}
            </Link>
          ) : (
            ticket.authorName
          )}
        </Row>
        <Row label={t.tickets.createdAtLabel}>
          <span className="text-xs">{formatDate(ticket.createdAt)}</span>
        </Row>
        <Row label={t.tickets.colUpdated}>
          <span className="text-xs">{formatDate(ticket.updatedAt)}</span>
        </Row>
      </dl>
      {isAgent && <StatusControl ticket={ticket} />}
    </aside>
  );
}