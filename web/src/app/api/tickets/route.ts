import {
	and,
	count,
	desc,
	eq,
	ilike,
	inArray,
	isNull,
	ne,
	or,
	sql,
} from 'drizzle-orm';
import { db } from '@/db';
import { messages, tickets, users } from '@/db/schema';
import { requireUser } from '@/lib/auth';
import {
	ATTENTION_STATUSES,
	PAGE_SIZE,
	STATUSES,
	isStaff,
} from '@/lib/constants';
import { HttpError, handle } from '@/lib/http';
import { likePattern } from '@/lib/search';
import { forViewer, ticketColumns, ticketScope } from '@/lib/tickets';
import { createTicketSchema, listQuerySchema } from '@/lib/validation/tickets';

export const GET = handle(async (req) => {
	const user = await requireUser();
	const query = listQuerySchema.parse(
		Object.fromEntries(new URL(req.url).searchParams),
	);
	const staff = isStaff(user.role);
	const supervisor = user.role === 'supervisor';

	const search =
		query.q ?
			staff ?
				or(
					ilike(tickets.title, likePattern(query.q)),
					ilike(users.name, likePattern(query.q)),
				)
			:	ilike(tickets.title, likePattern(query.q))
		:	undefined;
	// Clients never see the priority, so they cannot filter by it either (D26).
	const priority =
		staff && query.priority ? eq(tickets.priority, query.priority) : undefined;
	const organization =
		query.organization ?
			eq(tickets.organizationId, query.organization)
		:	undefined;
	// "Agents needed": no agent yet and not closed (D25).
	const unassigned = and(
		isNull(tickets.assigneeId),
		ne(tickets.status, 'closed'),
	);
	// "Message confirmation needed": an agent's reply on this ticket waits for review (D27).
	// Raw SQL so both columns keep their table names inside the correlated subquery.
	const needsReview = sql`exists (select 1 from ${messages} where ${messages.ticketId} = ${tickets.id} and ${messages.reviewStatus} = 'pending')`;

	// What every list and count here shares: D10 layer 3 is always applied.
	const base = and(ticketScope(user), priority, organization, search);
	const where = and(
		base,
		query.status ? eq(tickets.status, query.status) : undefined,
		query.attention ?
			inArray(tickets.status, [...ATTENTION_STATUSES])
		:	undefined,
		supervisor && query.unassigned ? unassigned : undefined,
		supervisor && query.review ? needsReview : undefined,
	);

	const [
		items,
		[{ total }],
		countRows,
		[{ unassignedCount }],
		[{ reviewCount }],
	] = await Promise.all([
			db
				.select(ticketColumns)
				.from(tickets)
				.innerJoin(users, eq(tickets.userId, users.id))
				.where(where)
				.orderBy(desc(tickets.updatedAt), desc(tickets.id))
				.limit(PAGE_SIZE)
				.offset((query.page - 1) * PAGE_SIZE),
			db
				.select({ total: count() })
				.from(tickets)
				.innerJoin(users, eq(tickets.userId, users.id))
				.where(where),
			// Counts per status for the tabs. They follow the search, priority and organization, but not the view,
			// so each tab says how many rows it would show and "all" matches the list under it.
			db
				.select({ status: tickets.status, n: count() })
				.from(tickets)
				.innerJoin(users, eq(tickets.userId, users.id))
				.where(base)
				.groupBy(tickets.status),
			db
				.select({ unassignedCount: count() })
				.from(tickets)
				.innerJoin(users, eq(tickets.userId, users.id))
				.where(and(base, unassigned)),
			db
				.select({ reviewCount: count() })
				.from(tickets)
				.innerJoin(users, eq(tickets.userId, users.id))
				.where(and(base, needsReview)),
		]);

	const statusCounts = Object.fromEntries(
		STATUSES.map((s) => [s, 0]),
	) as Record<(typeof STATUSES)[number], number>;
	for (const row of countRows) statusCounts[row.status] = row.n;
	const attentionCount = ATTENTION_STATUSES.reduce(
		(sum, s) => sum + statusCounts[s],
		0,
	);

	return Response.json({
		items: items.map((row) => forViewer(user, row)),
		total,
		page: query.page,
		pageSize: PAGE_SIZE,
		statusCounts,
		attentionCount,
		unassignedCount: supervisor ? unassignedCount : undefined,
		reviewCount: supervisor ? reviewCount : undefined,
	});
});

export const POST = handle(async (req) => {
	const user = await requireUser();
	if (user.role !== 'client') throw new HttpError(403, 'forbidden');

	const input = createTicketSchema.parse(await req.json());

	const [ticket] = await db
		.insert(tickets)
		.values({
			userId: user.id,
			title: input.title,
			description: input.description,
			// No priority: the supervisor sets it when assigning the ticket (D26).
			organizationId: user.organizationId, // D7, D24: copied from the author
		})
		.returning({ id: tickets.id });

	return Response.json({ id: ticket.id }, { status: 201 });
});
