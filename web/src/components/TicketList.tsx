'use client';

import { Fragment } from 'react';
import Link from 'next/link';
import { Skeleton } from '@heroui/react';
import { ATTENTION_STATUSES } from '@/lib/constants';
import { formatDate, formatRelative } from '@/lib/dates';
import { useMe } from '@/lib/hooks/use-me';
import type { TicketDto } from '@/lib/hooks/use-tickets';
import { t } from '@/lib/strings.fa';
import { AssigneeName } from './AssignPanel';
import { PriorityChip, StatusChip } from './chips';

/**
 * One row per ticket: the title, then one line of facts that starts with the status. The whole row is the
 * link, so it works with keyboard and touch. Rows that wait for the viewing agent get a dot before the title
 * (and screen-reader text), the way unread mail does.
 */
export function TicketList({
	tickets,
	showAuthor = false,
	showPriority = false,
	showAssignee = false,
	highlightAttention = false,
	hideStatus = false,
	empty,
}: {
	tickets: TicketDto[];
	showAuthor?: boolean;
	/** Staff only: clients never see the priority (D26). Only "high" is shown; the others are the quiet default. */
	showPriority?: boolean;
	/** Supervisor only: who has the ticket, or that nobody has it yet (D25). */
	showAssignee?: boolean;
	highlightAttention?: boolean;
	/** When the list is already filtered to one status, every row would repeat it. */
	hideStatus?: boolean;
	empty?: React.ReactNode;
}) {
	const { data: me } = useMe();

	if (tickets.length === 0) {
		return (
			<div className="rounded-2xl border border-border bg-surface">{empty}</div>
		);
	}

	return (
		<ul className="divide-y divide-separator overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--surface-shadow)]">
			{tickets.map((ticket) => {
				const needsAttention =
					highlightAttention &&
					(ATTENTION_STATUSES as readonly string[]).includes(ticket.status);
				const facts = [
					showAuthor && (
						<span
							dir="auto"
							className="truncate"
						>
							{ticket.authorName}
						</span>
					),
					showAssignee &&
						(ticket.assigneeId && me ?
							<span
								dir="auto"
								className="truncate"
							>
								<AssigneeName
									id={ticket.assigneeId}
									me={me}
								/>
							</span>
						:	<span className="text-warning-soft-foreground">
								{t.filters.unassigned}
							</span>),
					<time
						key="time"
						dateTime={ticket.updatedAt}
						title={formatDate(ticket.updatedAt)}
						className="shrink-0"
					>
						{formatRelative(ticket.updatedAt)}
					</time>,
				].filter(Boolean);
				return (
					<li key={ticket.id}>
						<Link
							href={`/tickets/${ticket.id}`}
							className="relative flex flex-col gap-1.5 px-4 py-3.5 transition-colors hover:bg-surface-secondary focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus sm:px-5"
						>
							{needsAttention && (
								<span
									aria-hidden
									className="absolute start-1.5 top-[1.3rem] size-2 rounded-full bg-accent-soft-foreground sm:start-2"
								/>
							)}
							{/* dir="auto" keeps an English title in its own order; text-right keeps every title on the same side. */}
							<p
								dir="auto"
								className="line-clamp-2 text-right font-medium sm:line-clamp-1"
							>
								{needsAttention && (
									<span className="sr-only">{t.tickets.needsAttention}: </span>
								)}
								{ticket.title}
							</p>
							<div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
								{!hideStatus && (
									<StatusChip
										status={ticket.status}
										withLabel
									/>
								)}
								{showPriority && ticket.priority === 'high' && (
									<PriorityChip
										priority={ticket.priority}
										withLabel
									/>
								)}
								{facts.map((fact, i) => (
									<Fragment key={i}>
										{i > 0 && <span aria-hidden>·</span>}
										{fact}
									</Fragment>
								))}
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
				<div
					key={i}
					className="space-y-2.5 px-4 py-4 sm:px-5"
				>
					<Skeleton className="h-4 w-2/3 rounded-lg" />
					<div className="flex items-center gap-2">
						<Skeleton className="h-5 w-14 rounded-full" />
						<Skeleton className="h-3 w-32 rounded-lg" />
					</div>
				</div>
			))}
		</div>
	);
}
