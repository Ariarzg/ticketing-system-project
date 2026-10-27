import { and, eq } from 'drizzle-orm';
import { db } from '@/db';
import { tickets, users } from '@/db/schema';
import { requireSupervisor } from '@/lib/auth';
import { HttpError, handle, uuidParam } from '@/lib/http';
import { assignSchema } from '@/lib/validation/tickets';

/** Supervisor only: gives a ticket its agent and its priority, once (D25, D26). */
export const POST = handle<{ params: Promise<{ id: string }> }>(
	async (req, ctx) => {
		await requireSupervisor();
		const id = await uuidParam(ctx);
		const { agentId, priority } = assignSchema.parse(await req.json());

		await db.transaction(async (tx) => {
			const [ticket] = await tx
				.select({ status: tickets.status, assigneeId: tickets.assigneeId })
				.from(tickets)
				.where(eq(tickets.id, id))
				.limit(1)
				.for('update');
			if (!ticket) throw new HttpError(404, 'not_found');
			if (ticket.status === 'closed')
				throw new HttpError(409, 'ticket_closed');
			if (ticket.assigneeId) throw new HttpError(409, 'already_assigned');

			const [agent] = await tx
				.select({ id: users.id })
				.from(users)
				.where(and(eq(users.id, agentId), eq(users.role, 'agent')))
				.limit(1);
			if (!agent) throw new HttpError(400, 'invalid_input');

			await tx
				.update(tickets)
				.set({ assigneeId: agent.id, priority, updatedAt: new Date() })
				.where(eq(tickets.id, id));
		});

		return Response.json({ ok: true });
	},
);
