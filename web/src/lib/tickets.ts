import {
	and,
	asc,
	count,
	eq,
	inArray,
	isNull,
	or,
	type SQL,
} from 'drizzle-orm';
import { db } from '@/db';
import { attachments, messages, tickets, users } from '@/db/schema';
import type { SessionUser } from './auth';
import type { AttachmentDto } from './files';
import { HttpError } from './http';
import { TransitionError, transition, type TicketAction } from './lifecycle';
import { STATUSES, type Priority, type Role, type Status } from './constants';

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

/** A client sees a reply only when it needs no review or the supervisor let it through (D27), and its files the same way (D28). */
export const deliveredToClient = or(
	isNull(messages.reviewStatus),
	inArray(messages.reviewStatus, ['confirmed', 'changed']),
);

/**
 * Every file of a ticket, grouped by the message it belongs to; the key `null` holds the description's files.
 * It does not check access: call it only after `getVisibleTicket`.
 */
export async function ticketFiles(ticketId: string) {
	const rows = await db
		.select({
			id: attachments.id,
			messageId: attachments.messageId,
			name: attachments.name,
			type: attachments.type,
			size: attachments.size,
		})
		.from(attachments)
		.where(eq(attachments.ticketId, ticketId))
		// Files of one message share the same created time, so the name gives a stable order.
		.orderBy(asc(attachments.name));
	const byOwner = new Map<string | null, AttachmentDto[]>();
	for (const { messageId, ...file } of rows) {
		byOwner.set(messageId, [...(byOwner.get(messageId) ?? []), file]);
	}
	return byOwner;
}

/** How many of these tickets are in each status, and in total. */
export async function ticketStats(where: SQL | undefined) {
	const rows = await db
		.select({ status: tickets.status, n: count() })
		.from(tickets)
		.where(where)
		.groupBy(tickets.status);
	const stats = Object.fromEntries(STATUSES.map((s) => [s, 0])) as Record<
		Status,
		number
	>;
	for (const row of rows) stats[row.status] = row.n;
	return { ...stats, total: rows.reduce((sum, row) => sum + row.n, 0) };
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
