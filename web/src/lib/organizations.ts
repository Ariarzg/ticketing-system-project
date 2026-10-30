import { asc, desc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { organizations, users } from '@/db/schema';
import { HttpError } from './http';

/** One organization, or a 404. */
export async function findOrganization(id: string) {
	const [organization] = await db
		.select({
			id: organizations.id,
			name: organizations.name,
			isDefault: organizations.isDefault,
			createdAt: organizations.createdAt,
		})
		.from(organizations)
		.where(eq(organizations.id, id))
		.limit(1);
	if (!organization) throw new HttpError(404, 'not_found');
	return organization;
}

/** Everyone in an organization: staff first (supervisor, then agents), then clients, each by name (D29). */
export function organizationMembers(id: string) {
	return (
		db
			.select({
				id: users.id,
				slug: users.slug,
				name: users.name,
				email: users.email,
				role: users.role,
				createdAt: users.createdAt,
			})
			.from(users)
			.where(eq(users.organizationId, id))
			.orderBy(desc(users.role), asc(users.name))
			// shortcut: no paging past 500 people; add it if an organization ever outgrows that.
			.limit(500)
	);
}
