import { and, count, eq } from 'drizzle-orm';
import { db } from '@/db';
import { organizations, tickets, users } from '@/db/schema';
import type { SessionUser } from './auth';
import { HttpError } from './http';

/**
 * Whose profile this is, and which of their tickets this viewer may see. Shared by the profile and its
 * export (D30), so both follow the same rules. 404 when the viewer may not open it (D11, D25).
 */
export async function profileScope(me: SessionUser, slug: string) {
	const [target] = await db
		.select({
			id: users.id,
			slug: users.slug,
			name: users.name,
			email: users.email,
			role: users.role,
			organizationId: users.organizationId,
			organizationName: organizations.name,
			createdAt: users.createdAt,
		})
		.from(users)
		.innerJoin(organizations, eq(users.organizationId, organizations.id))
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

	return { target, ofTarget, agentProfile };
}
