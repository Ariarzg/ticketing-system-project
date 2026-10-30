// Server side of the exports (D30): the rows behind a report, and the response that sends them.
import { count, desc, eq, sql, type SQL } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { db } from '@/db';
import { messages, organizations, tickets, users } from '@/db/schema';
import { toCsv } from './csv';
import type { AgentStats, ExportSection, ExportTicket } from './reports';

// shortcut: one response with up to 5000 tickets; page or stream it if a report ever needs more.
const EXPORT_LIMIT = 5000;

const assignee = alias(users, 'assignee');

/** A report's tickets with names in place of ids. A client never gets the priority or the agent (D26). */
export async function exportTickets(
	where: SQL | undefined,
	staffView: boolean,
): Promise<ExportTicket[]> {
	const rows = await db
		.select({
			id: tickets.id,
			title: tickets.title,
			status: tickets.status,
			priority: tickets.priority,
			organizationName: organizations.name,
			authorName: users.name,
			assigneeName: assignee.name,
			createdAt: tickets.createdAt,
			updatedAt: tickets.updatedAt,
		})
		.from(tickets)
		.innerJoin(users, eq(tickets.userId, users.id))
		.innerJoin(organizations, eq(tickets.organizationId, organizations.id))
		.leftJoin(assignee, eq(tickets.assigneeId, assignee.id))
		.where(where)
		.orderBy(desc(tickets.updatedAt), desc(tickets.id))
		.limit(EXPORT_LIMIT);
	return staffView ? rows : (
			rows.map((row) => ({ ...row, priority: null, assigneeName: null }))
		);
}

/** What an agent's replies came to: tickets answered (a reply reached the client) and replies by review outcome (D27). */
export async function agentStats(agentId: string): Promise<AgentStats> {
	// Agent replies from before v1.4 have no review status and reached the client too.
	const delivered = sql`(${messages.reviewStatus} is null or ${messages.reviewStatus} in ('confirmed', 'changed'))`;
	const withStatus = (status: 'confirmed' | 'changed' | 'denied' | 'pending') =>
		sql<number>`count(*) filter (where ${messages.reviewStatus} = ${sql.raw(`'${status}'`)})`.mapWith(
			Number,
		);
	const [row] = await db
		.select({
			replies: count(),
			answeredTickets:
				sql<number>`count(distinct ${messages.ticketId}) filter (where ${delivered})`.mapWith(
					Number,
				),
			confirmed: withStatus('confirmed'),
			changed: withStatus('changed'),
			denied: withStatus('denied'),
			pending: withStatus('pending'),
		})
		.from(messages)
		.where(eq(messages.authorId, agentId));
	return row;
}

/**
 * The print page reads the data as JSON; `?format=csv` downloads the same report as a CSV file instead.
 * Both come from the same sections, so they hold the same rows (D30).
 */
export function exportResponse(
	req: Request,
	data: unknown,
	sections: ExportSection[],
	fileName: string,
): Response {
	if (new URL(req.url).searchParams.get('format') !== 'csv') {
		return Response.json(data);
	}
	return new Response(toCsv(sections), {
		headers: {
			'Content-Type': 'text/csv; charset=utf-8',
			// filename* carries a Persian name; the plain one is for clients that only read that.
			'Content-Disposition': `attachment; filename="export.csv"; filename*=UTF-8''${encodeURIComponent(fileName)}.csv`,
		},
	});
}
