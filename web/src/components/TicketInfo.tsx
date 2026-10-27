import Link from 'next/link';
import { Avatar } from '@heroui/react';
import { isStaff } from '@/lib/constants';
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

/** A short reference people can quote ("#91DEC946"): the start of the ticket's id. */
export function ticketRef(id: string): string {
	return `#${id.slice(0, 8).toUpperCase()}`;
}

/** The side panel of a ticket: its facts, for staff the priority, agent and status buttons, and for the supervisor the assign panel. */
export function TicketInfo({ ticket, me }: { ticket: TicketDto; me: MeUser }) {
	const staff = isStaff(me.role);
	const canAssign =
		me.role === 'supervisor' && !ticket.assigneeId && ticket.status !== 'closed';
	return (
		<aside className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-4 shadow-[var(--surface-shadow)]">
			<dl className="divide-y divide-separator">
				<Row label={t.tickets.reference}>
					<bdi
						dir="ltr"
						className="font-medium tabular-nums"
					>
						{ticketRef(ticket.id)}
					</bdi>
				</Row>
				<Row label={t.tickets.colStatus}>
					<StatusChip status={ticket.status} />
				</Row>
				{/* Clients never see the priority or the agent (D26). */}
				{staff && (
					<Row label={t.tickets.colPriority}>
						<PriorityChip priority={ticket.priority} />
					</Row>
				)}
				{staff && (
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
				<Row label={t.tickets.colOrganization}>
					<OrganizationChip id={ticket.organizationId} />
				</Row>
				{/* A client does not need to be told that they wrote their own ticket. */}
				{ticket.authorId !== me.id && (
					<Row label={t.tickets.colAuthor}>
						{staff ?
							<Link
								href={`/users/${ticket.authorSlug}`}
								className="inline-flex items-center gap-2 font-medium hover:underline"
							>
								<Avatar
									size="sm"
									className="size-6 text-xs"
								>
									<Avatar.Fallback>
										{initials(ticket.authorName)}
									</Avatar.Fallback>
								</Avatar>
								<span
									dir="auto"
									className="truncate"
								>
									{ticket.authorName}
								</span>
							</Link>
						:	ticket.authorName}
					</Row>
				)}
				<Row label={t.tickets.createdAtLabel}>
					{formatDate(ticket.createdAt)}
				</Row>
				<Row label={t.tickets.colUpdated}>{formatDate(ticket.updatedAt)}</Row>
			</dl>
			{canAssign && <AssignPanel ticketId={ticket.id} />}
			{staff && <StatusControl ticket={ticket} />}
		</aside>
	);
}
