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
import { readBody, saveFiles } from '@/lib/storage';
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

	const [items, [{ total }], countRows] = await Promise.all([
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
			// Counts for the status filter and the queue tabs, in one pass. They follow the search, priority and
			// organization, but not the view, so each says how many rows it would show.
			db
				.select({
					status: tickets.status,
					n: count(),
					unassigned: sql<number>`count(*) filter (where ${unassigned})`.mapWith(Number),
					review: sql<number>`count(*) filter (where ${needsReview})`.mapWith(Number),
				})
				.from(tickets)
				.innerJoin(users, eq(tickets.userId, users.id))
				.where(base)
				.groupBy(tickets.status),
		]);

	const statusCounts = Object.fromEntries(
		STATUSES.map((s) => [s, 0]),
	) as Record<(typeof STATUSES)[number], number>;
	let unassignedCount = 0;
	let reviewCount = 0;
	// The queue tabs sit above the status filter, so their counts follow a chosen status too.
	const inStatus = (s: (typeof STATUSES)[number]) =>
		!query.status || query.status === s;
	for (const row of countRows) {
		statusCounts[row.status] = row.n;
		if (!inStatus(row.status)) continue;
		unassignedCount += row.unassigned;
		reviewCount += row.review;
	}
	const attentionCount = ATTENTION_STATUSES.reduce(
		(sum, s) => sum + (inStatus(s) ? statusCounts[s] : 0),
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

	const { fields, files } = await readBody(req);
	const input = createTicketSchema.parse(fields);

	const ticket = await db.transaction(async (tx) => {
		const [created] = await tx
			.insert(tickets)
			.values({
				userId: user.id,
				title: input.title,
				description: input.description,
				// No priority: the supervisor sets it when assigning the ticket (D26).
				organizationId: user.organizationId, // D7, D24: copied from the author
			})
			.returning({ id: tickets.id });
		// The files belong to the description, the first bubble of the thread (D17, D28).
		await saveFiles(tx, files, { ticketId: created.id });
		return created;
	});

	return Response.json({ id: ticket.id }, { status: 201 });
});
