import { and, eq } from 'drizzle-orm';
import { db } from '@/db';
import { attachments, messages, tickets } from '@/db/schema';
import { requireUser } from '@/lib/auth';
import { HttpError, handle, uuidParam } from '@/lib/http';
import { fileResponse } from '@/lib/storage';
import { deliveredToClient, ticketScope } from '@/lib/tickets';

/**
 * Opens one attachment: checks that the viewer may see it, then sends the file from our own domain.
 * The rules are the thread's: the ticket must be visible (D25), and a client gets a reply's files only
 * once the reply was delivered (D27). Anything else is 404, as for tickets (D11).
 */
export const GET = handle<{ params: Promise<{ id: string }> }>(
	async (_req, ctx) => {
		const user = await requireUser();
		const id = await uuidParam(ctx);

		const [file] = await db
			.select({
				id: attachments.id,
				ticketId: attachments.ticketId,
				name: attachments.name,
				type: attachments.type,
			})
			.from(attachments)
			.innerJoin(tickets, eq(attachments.ticketId, tickets.id))
			// The description's files have no message: the left join then leaves review_status null, which a client may see.
			.leftJoin(messages, eq(attachments.messageId, messages.id))
			.where(
				and(
					eq(attachments.id, id),
					ticketScope(user),
					user.role === 'client' ? deliveredToClient : undefined,
				),
			)
			.limit(1);
		if (!file) throw new HttpError(404, 'not_found');

		return fileResponse(file);
	},
);
