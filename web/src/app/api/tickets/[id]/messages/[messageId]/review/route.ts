import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { messages, tickets } from '@/db/schema';
import { requireSupervisor } from '@/lib/auth';
import { HttpError, handle } from '@/lib/http';
import { nextStatusOrHttpError } from '@/lib/tickets';
import { reviewSchema } from '@/lib/validation/tickets';

type Ctx = { params: Promise<{ id: string; messageId: string }> };

/** Supervisor only: confirms, changes or denies an agent's reply that waits for review (D27). */
export const POST = handle<Ctx>(async (req, ctx) => {
	const me = await requireSupervisor();
	const { id, messageId } = await ctx.params;
	if (!z.uuid().safeParse(id).success || !z.uuid().safeParse(messageId).success) {
		throw new HttpError(404, 'not_found');
	}
	const input = reviewSchema.parse(await req.json());

	await db.transaction(async (tx) => {
		const [ticket] = await tx
			.select({ status: tickets.status })
			.from(tickets)
			.where(eq(tickets.id, id))
			.limit(1)
			.for('update');
		if (!ticket) throw new HttpError(404, 'not_found');

		const [message] = await tx
			.select({ reviewStatus: messages.reviewStatus })
			.from(messages)
			.where(and(eq(messages.id, messageId), eq(messages.ticketId, id)))
			.limit(1)
			.for('update');
		if (!message) throw new HttpError(404, 'not_found');
		if (message.reviewStatus !== 'pending')
			throw new HttpError(409, 'already_reviewed');

		const reviewed = { reviewedById: me.id, reviewedAt: new Date() };

		if (input.action === 'deny') {
			// The client never sees a denied reply, so the ticket's status does not move.
			await tx
				.update(messages)
				.set({ ...reviewed, reviewStatus: 'denied', reviewNote: input.note })
				.where(eq(messages.id, messageId));
			await tx
				.update(tickets)
				.set({ updatedAt: new Date() })
				.where(eq(tickets.id, id));
			return;
		}

		// Confirmed or changed, the reply reaches the client now: this is when the ticket becomes "answered".
		const next = nextStatusOrHttpError(
			ticket.status,
			{ type: 'deliver' },
			me.role,
		);
		await tx
			.update(messages)
			.set({
				...reviewed,
				reviewStatus: input.action === 'confirm' ? 'confirmed' : 'changed',
				editedBody: input.action === 'change' ? input.body : null,
			})
			.where(eq(messages.id, messageId));
		await tx
			.update(tickets)
			.set({ status: next, updatedAt: new Date() })
			.where(eq(tickets.id, id));
	});

	return Response.json({ ok: true });
});
