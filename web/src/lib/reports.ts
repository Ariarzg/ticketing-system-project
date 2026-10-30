// The content of the exports (D30), shared by the CSV route (server) and the print pages (browser), so a PDF
// and a CSV of the same thing always hold the same rows. Pure: no database, no Bun, no React.
import { STATUSES, type Priority, type Role, type Status } from './constants';
import { formatDate, formatDay } from './dates';
import { t } from './strings.fa';

/** A short reference people can quote ("#91DEC946"): the start of the ticket's id. */
export function ticketRef(id: string): string {
	return `#${id.slice(0, 8).toUpperCase()}`;
}

/** A date as the server has it (Date) or as JSON brings it (string). */
type When = string | Date;

export type ExportTicket = {
	id: string;
	title: string;
	status: Status;
	/** Null when not set yet, and always null for a client (D26). */
	priority: Priority | null;
	organizationName: string;
	authorName: string;
	/** Null when unassigned, and always null for a client (D26). */
	assigneeName: string | null;
	createdAt: When;
	updatedAt: When;
};

export type TicketCounts = Record<Status, number> & { total: number };

export type AgentStats = {
	replies: number;
	/** Tickets with at least one reply of the agent that reached the client (D27). */
	answeredTickets: number;
	confirmed: number;
	changed: number;
	denied: number;
	pending: number;
};

export type ProfileExport = {
	user: {
		name: string;
		email: string;
		role: Role;
		organizationName: string;
		createdAt: When;
	};
	stats: TicketCounts;
	agentStats: AgentStats | null;
	tickets: ExportTicket[];
	/** Staff see the priority and agent columns; a client exporting their own profile does not. */
	staffView: boolean;
};

export type OrganizationExport = {
	organization: { name: string; isDefault: boolean; createdAt: When };
	stats: TicketCounts;
	members: { name: string; email: string; role: Role; createdAt: When }[];
	tickets: ExportTicket[];
};

/** One block of an export: label/value pairs, or a table with a header row. */
export type ExportSection =
	| { title: string; pairs: [string, string | number][] }
	| { title: string; head: string[]; rows: (string | number)[][] };

const L = t.exports;

function countPairs(stats: TicketCounts): [string, number][] {
	return [
		[L.total, stats.total],
		...STATUSES.map((s): [string, number] => [t.status[s], stats[s]]),
	];
}

function ticketTable(
	title: string,
	tickets: ExportTicket[],
	staff: boolean,
): ExportSection {
	return {
		title,
		head: [
			L.ref,
			L.title,
			L.status,
			...(staff ? [L.priority, L.agent] : []),
			L.author,
			L.organization,
			L.created,
			L.updated,
		],
		rows: tickets.map((x) => [
			ticketRef(x.id),
			x.title,
			t.status[x.status],
			...(staff ?
				[
					x.priority ? t.priority[x.priority] : t.priority.unset,
					x.assigneeName ?? L.unassigned,
				]
			:	[]),
			x.authorName,
			x.organizationName,
			formatDate(x.createdAt),
			formatDate(x.updatedAt),
		]),
	};
}

/** A client's or an agent's report: who they are, their counts, and their tickets (for an agent, the assigned ones). */
export function profileSections(d: ProfileExport): ExportSection[] {
	const a = d.agentStats;
	const agentPairs: [string, number][] =
		a ?
			[
				[L.answeredTickets, a.answeredTickets],
				[L.replies, a.replies],
				[L.confirmed, a.confirmed],
				[L.changed, a.changed],
				[L.denied, a.denied],
				[L.pending, a.pending],
			]
		:	[];
	return [
		{
			title: L.details,
			pairs: [
				[L.name, d.user.name],
				[L.email, d.user.email],
				[L.role, t.role[d.user.role]],
				[L.organization, d.user.organizationName],
				[L.joined, formatDay(d.user.createdAt)],
			],
		},
		{ title: L.counts, pairs: [...countPairs(d.stats), ...agentPairs] },
		ticketTable(a ? L.assignedTickets : L.tickets, d.tickets, d.staffView),
	];
}

/** An organization's report: its details, counts, every member and every ticket. */
export function organizationSections(d: OrganizationExport): ExportSection[] {
	return [
		{
			title: L.details,
			pairs: [
				[L.name, d.organization.name],
				[L.isDefault, d.organization.isDefault ? L.yes : L.no],
				[L.created, formatDay(d.organization.createdAt)],
				[L.membersCount, d.members.length],
			],
		},
		{ title: L.counts, pairs: countPairs(d.stats) },
		{
			title: L.members,
			head: [L.name, L.email, L.role, L.joined],
			rows: d.members.map((m) => [
				m.name,
				m.email,
				t.role[m.role],
				formatDay(m.createdAt),
			]),
		},
		ticketTable(L.tickets, d.tickets, true),
	];
}
