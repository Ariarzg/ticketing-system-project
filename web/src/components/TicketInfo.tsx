import { Fragment } from 'react';
import Link from 'next/link';
import { Avatar } from '@heroui/react';
import { ticketRef } from '@/lib/reports';
import { formatDate } from '@/lib/dates';
import type { MeUser } from '@/lib/hooks/use-me';
import type { TicketDto } from '@/lib/hooks/use-tickets';
import { initials } from '@/lib/initials';
import { t } from '@/lib/strings.fa';
import { AssignPanel, AssigneeName } from './AssignPanel';
import { PriorityChip, StatusChip } from './chips';
import { OrganizationChip } from './OrganizationChip';
import { StatusControl } from './StatusControl';

function Row({
	label,
	children,
}: {
	label: string;
	children: React.ReactNode;
}) {
	return (
		<div className="flex items-center justify-between gap-3 py-2.5">
			<dt className="shrink-0 text-sm text-muted">{label}</dt>
			<dd className="min-w-0 text-sm">{children}</dd>
		</div>
	);
}

/**
 * The ticket's facts in one line under its title. Clients get only this (status, reference, date), since the rest
 * is either theirs or hidden from them (D26). Staff get it on phones, where the full panel follows the thread.
 */
export function TicketSummary({
	ticket,
	me,
	className = '',
}: {
	ticket: TicketDto;
	me: MeUser;
	className?: string;
}) {
	const facts =
		me.role === 'client' ?
			[
				<bdi
					key="ref"
					dir="ltr"
					className="tabular-nums"
				>
					{ticketRef(ticket.id)}
				</bdi>,
				<span key="created">
					{t.tickets.createdAtLabel}: {formatDate(ticket.createdAt)}
				</span>,
			]
		: me.role === 'supervisor' ?
			[
				ticket.assigneeId ?
					<span
						key="agent"
						dir="auto"
					>
						<AssigneeName
							id={ticket.assigneeId}
							me={me}
						/>
					</span>
				:	<span
						key="agent"
						className="text-warning-soft-foreground"
					>
						{t.filters.unassigned}
					</span>,
			]
		:	[];
	return (
		<div
			className={`flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted ${className}`}
		>
			<StatusChip
				status={ticket.status}
				withLabel
			/>
			{me.role !== 'client' && ticket.priority && (
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
	);
}

/**
 * Staff only: the ticket's facts, the supervisor's assign panel while nobody has it, and the status buttons.
 * Rows that say nothing are left out: your own name as the agent, and the "not set yet" rows above the form
 * that sets them.
 */
export function TicketInfo({ ticket, me }: { ticket: TicketDto; me: MeUser }) {
	const canAssign =
		me.role === 'supervisor' && !ticket.assigneeId && ticket.status !== 'closed';
	const created = formatDate(ticket.createdAt);
	const updated = formatDate(ticket.updatedAt);
	return (
		<aside className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-4 shadow-[var(--surface-shadow)]">
			<dl className="divide-y divide-separator">
				<Row label={t.tickets.colStatus}>
					<StatusChip status={ticket.status} />
				</Row>
				{!canAssign && (
					<Row label={t.tickets.colPriority}>
						<PriorityChip priority={ticket.priority} />
					</Row>
				)}
				{!canAssign && ticket.assigneeId !== me.id && (
					<Row label={t.tickets.colAssignee}>
						{ticket.assigneeId ?
							<span
								dir="auto"
								className="truncate font-medium"
							>
								<AssigneeName
									id={ticket.assigneeId}
									me={me}
								/>
							</span>
						:	<span className="text-muted">{t.assign.none}</span>}
					</Row>
				)}
				<Row label={t.tickets.colAuthor}>
					<Link
						href={`/users/${ticket.authorSlug}`}
						className="inline-flex items-center gap-2 font-medium hover:underline"
					>
						<Avatar
							size="sm"
							className="size-6 text-xs"
						>
							<Avatar.Fallback>{initials(ticket.authorName)}</Avatar.Fallback>
						</Avatar>
						<span
							dir="auto"
							className="truncate"
						>
							{ticket.authorName}
						</span>
					</Link>
				</Row>
				<Row label={t.tickets.colOrganization}>
					<OrganizationChip id={ticket.organizationId} />
				</Row>
				<Row label={t.tickets.reference}>
					<bdi
						dir="ltr"
						className="tabular-nums"
					>
						{ticketRef(ticket.id)}
					</bdi>
				</Row>
				<Row label={t.tickets.createdAtLabel}>{created}</Row>
				{updated !== created && (
					<Row label={t.tickets.colUpdated}>{updated}</Row>
				)}
			</dl>
			{canAssign && <AssignPanel ticketId={ticket.id} />}
			<StatusControl
				ticket={ticket}
				me={me}
			/>
		</aside>
	);
}
