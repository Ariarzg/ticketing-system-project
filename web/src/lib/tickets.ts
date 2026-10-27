import { and, eq } from 'drizzle-orm';
import { db } from '@/db';
import { tickets, users } from '@/db/schema';
import type { SessionUser } from './auth';
import { HttpError } from './http';
import { TransitionError, transition, type TicketAction } from './lifecycle';
import type { Priority, Role, Status } from './constants';

/** The columns every ticket response contains (ticket + author). */
export const ticketColumns = {
	id: tickets.id,
	title: tickets.title,
	description: tickets.description,
	priority: tickets.priority,
	status: tickets.status,
	organizationId: tickets.organizationId,
	assigneeId: tickets.assigneeId,
	createdAt: tickets.createdAt,
	updatedAt: tickets.updatedAt,
	authorId: tickets.userId,
	authorName: users.name,
	authorSlug: users.slug,
};

/** Layer 3 of D10: which tickets may this user touch at all? (D25) */
export function ticketScope(user: SessionUser) {
	if (user.role === 'supervisor') return undefined;
	if (user.role === 'agent') return eq(tickets.assigneeId, user.id);
	return eq(tickets.userId, user.id);
}

/** Clients never see the priority or who works on their ticket (D26). */
export function forViewer<
	T extends { priority: Priority | null; assigneeId: string | null },
>(user: SessionUser, row: T): T {
	return user.role === 'client' ?
			{ ...row, priority: null, assigneeId: null }
		:	row;
}

/** One ticket the user is allowed to see, or a 404. */
export async function getVisibleTicket(user: SessionUser, id: string) {
	const [row] = await db
		.select(ticketColumns)
		.from(tickets)
		.innerJoin(users, eq(tickets.userId, users.id))
		.where(and(eq(tickets.id, id), ticketScope(user)))
		.limit(1);
	if (!row) throw new HttpError(404, 'not_found');
	return forViewer(user, row);
}

/** Runs the lifecycle function and turns its errors into HTTP errors. */
export function nextStatusOrHttpError(
	current: Status,
	action: TicketAction,
	role: Role,
): Status {
	try {
		return transition(current, action, role);
	} catch (e) {
		if (e instanceof TransitionError) {
			throw new HttpError(e.code === 'forbidden' ? 403 : 409, e.code);
		}
		throw e;
	}
}
