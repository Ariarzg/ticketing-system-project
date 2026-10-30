import { and, asc, count, desc, eq, sql } from 'drizzle-orm';
import { db } from '@/db';
import { tickets, users } from '@/db/schema';
import { requireUser } from '@/lib/auth';
import { STATUSES } from '@/lib/constants';
import { HttpError, handle } from '@/lib/http';
import { forViewer, ticketColumns } from '@/lib/tickets';

export const GET = handle<{ params: Promise<{ slug: string }> }>(
	async (_req, ctx) => {
		const me = await requireUser();
		const { slug } = await ctx.params;

		const [target] = await db
			.select({
				id: users.id,
				slug: users.slug,
				name: users.name,
				email: users.email,
				role: users.role,
				organizationId: users.organizationId,
				createdAt: users.createdAt,
			})
			.from(users)
			.where(eq(users.slug, slug))
			.limit(1);
		if (!target) throw new HttpError(404, 'not_found');

		// An agent only sees the tickets assigned to them (D25); the supervisor sees all, a client only their own.
		const mine = me.role === 'agent' ? eq(tickets.assigneeId, me.id) : undefined;
		// A client's tickets are the ones they filed; an agent's are the ones assigned to them (D29).
		const agentProfile = target.role === 'agent';
		const ofTarget = and(
			agentProfile ?
				eq(tickets.assigneeId, target.id)
			:	eq(tickets.userId, target.id),
			mine,
		);

		if (target.id !== me.id) {
			if (me.role === 'client') throw new HttpError(404, 'not_found');
			if (me.role === 'agent') {
				const [{ n }] = await db
					.select({ n: count() })
					.from(tickets)
					.where(ofTarget);
				if (n === 0) throw new HttpError(404, 'not_found');
			}
		}

		const rows = await db
			.select({ status: tickets.status, n: count() })
			.from(tickets)
			.where(ofTarget)
			.groupBy(tickets.status);

		const stats = Object.fromEntries(STATUSES.map((s) => [s, 0])) as Record<
			(typeof STATUSES)[number],
			number
		>;
		for (const row of rows) stats[row.status] = row.n;
		const total = Object.values(stats).reduce((a, b) => a + b, 0);

		const userTickets = await db
			.select(ticketColumns)
			.from(tickets)
			.innerJoin(users, eq(tickets.userId, users.id))
			.where(ofTarget)
			.orderBy(
				// An agent's profile lists active and closed apart: active first, so the cap never hides one.
				...(agentProfile ? [asc(sql`${tickets.status} = 'closed'`)] : []),
				desc(tickets.updatedAt),
				desc(tickets.id),
			)
			.limit(50);

		return Response.json({
			user: target,
			stats: { ...stats, total },
			tickets: userTickets.map((row) => forViewer(me, row)),
		});
	},
);
