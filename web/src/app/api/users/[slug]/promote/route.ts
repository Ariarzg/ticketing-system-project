import { count, eq } from 'drizzle-orm';
import { db } from '@/db';
import { organizations, tickets, users } from '@/db/schema';
import { requireSupervisor } from '@/lib/auth';
import { HttpError, handle } from '@/lib/http';

/** Supervisor only (D23): turns a client without tickets into an agent in the default organization. */
export const POST = handle<{ params: Promise<{ slug: string }> }>(
	async (_req, ctx) => {
		await requireSupervisor();
		const { slug } = await ctx.params;

		await db.transaction(async (tx) => {
			const [target] = await tx
				.select({ id: users.id, role: users.role })
				.from(users)
				.where(eq(users.slug, slug))
				.limit(1)
				.for('update');
			if (!target) throw new HttpError(404, 'not_found');
			if (target.role !== 'client') throw new HttpError(409, 'not_a_client');

			const [{ n }] = await tx
				.select({ n: count() })
				.from(tickets)
				.where(eq(tickets.userId, target.id));
			if (n > 0) throw new HttpError(409, 'has_tickets');

			// Staff always belong to the default organization (D24).
			const [fallback] = await tx
				.select({ id: organizations.id })
				.from(organizations)
				.where(eq(organizations.isDefault, true))
				.limit(1);
			await tx
				.update(users)
				.set({ role: 'agent', organizationId: fallback.id })
				.where(eq(users.id, target.id));
		});

		return Response.json({ ok: true });
	},
);
