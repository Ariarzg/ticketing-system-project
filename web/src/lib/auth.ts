import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { users } from '@/db/schema';
import { isStaff } from './constants';
import { readSessionUserId } from './session';
import { HttpError } from './http';

export async function getCurrentUser() {
	const id = await readSessionUserId();
	if (!id) return null;
	const [user] = await db
		.select({
			id: users.id,
			slug: users.slug,
			name: users.name,
			email: users.email,
			role: users.role,
			organizationId: users.organizationId,
		})
		.from(users)
		.where(eq(users.id, id))
		.limit(1);
	return user ?? null;
}

export type SessionUser = NonNullable<
	Awaited<ReturnType<typeof getCurrentUser>>
>;

/** Layer 1: must be logged in, otherwise 401. */
export async function requireUser(): Promise<SessionUser> {
	const user = await getCurrentUser();
	if (!user) throw new HttpError(401, 'unauthorized');
	return user;
}

/** Layer 2: must be staff (an agent or a supervisor), otherwise 403. */
export async function requireStaff(): Promise<SessionUser> {
	const user = await requireUser();
	if (!isStaff(user.role)) throw new HttpError(403, 'forbidden');
	return user;
}

/** Layer 2 for supervisor-only routes (D23, D24), otherwise 403. */
export async function requireSupervisor(): Promise<SessionUser> {
	const user = await requireUser();
	if (user.role !== 'supervisor') throw new HttpError(403, 'forbidden');
	return user;
}
