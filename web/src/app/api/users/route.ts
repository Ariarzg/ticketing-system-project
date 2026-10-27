import { and, asc, desc, eq, ilike, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { tickets, users } from '@/db/schema';
import { requireStaff } from '@/lib/auth';
import { handle } from '@/lib/http';
import { likePattern } from '@/lib/search';

const querySchema = z.object({ q: z.string().trim().max(100).optional() });

export const GET = handle(async (req) => {
	const me = await requireStaff();
	const { q } = querySchema.parse(
		Object.fromEntries(new URL(req.url).searchParams),
	);
	const openTickets =
		sql<number>`count(${tickets.id}) filter (where ${tickets.status} <> 'closed')`.mapWith(
			Number,
		);
	// An agent only counts, and only lists, clients whose tickets are assigned to them (D25).
	const agent = me.role === 'agent';
	const mine = agent ? eq(tickets.assigneeId, me.id) : undefined;

	const items = await db
		.select({
			id: users.id,
			slug: users.slug,
			name: users.name,
			email: users.email,
			organizationId: users.organizationId,
			createdAt: users.createdAt,
			openTickets,
		})
		.from(users)
		.leftJoin(tickets, and(eq(tickets.userId, users.id), mine))
		.where(
			and(
				eq(users.role, 'client'),
				q ? ilike(users.name, likePattern(q)) : undefined,
			),
		)
		.groupBy(users.id)
		.having(agent ? sql`count(${tickets.id}) > 0` : undefined)
		// Staff look for whoever is waiting most, so the busiest users come first.
		.orderBy(desc(openTickets), asc(users.name))
		.limit(200);

	return Response.json({ items });
});
