import { db } from '@/db';
import { organizations } from '@/db/schema';
import { requireSupervisor } from '@/lib/auth';
import { handle, HttpError } from '@/lib/http';
import { organizationSchema } from '@/lib/validation/organizations';
import { asc, desc, eq } from 'drizzle-orm';

export const GET = handle(async () => {
	const items = await db
		.select({
			id: organizations.id,
			name: organizations.name,
			isDefault: organizations.isDefault,
			createdAt: organizations.createdAt,
		})
		.from(organizations)
		.orderBy(desc(organizations.isDefault), asc(organizations.name));

	return Response.json({ items });
});

export const POST = handle(async (req) => {
	await requireSupervisor();
	const { name } = organizationSchema.parse(await req.json());

	const [taken] = await db
		.select({ id: organizations.id })
		.from(organizations)
		.where(eq(organizations.name, name))
		.limit(1);

	if (taken) throw new HttpError(409, 'org_name_taken');

	const [organization] = await db
		.insert(organizations)
		.values({ name })
		.returning({ id: organizations.id });

	return Response.json({ organization }, { status: 201 });
});
