import { asc, desc, eq, sql } from 'drizzle-orm';
import { db } from '@/db';
import { tickets, users } from '@/db/schema';
import { requireUser } from '@/lib/auth';
import { handle } from '@/lib/http';
import { profileScope } from '@/lib/profiles';
import { forViewer, ticketColumns, ticketStats } from '@/lib/tickets';

export const GET = handle<{ params: Promise<{ slug: string }> }>(
	async (_req, ctx) => {
		const me = await requireUser();
		const { slug } = await ctx.params;
		const { target, ofTarget, agentProfile } = await profileScope(me, slug);

		const [stats, userTickets] = await Promise.all([
			ticketStats(ofTarget),
			db
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
				.limit(50),
		]);

		return Response.json({
			user: target,
			stats,
			tickets: userTickets.map((row) => forViewer(me, row)),
		});
	},
);
