// file: src/app/api/auth/signup/route.ts
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { organizations, users } from '@/db/schema';
import { HttpError, handle } from '@/lib/http';
import { createSession } from '@/lib/session';
import { makeSlug } from '@/lib/slug';
import { signupSchema } from '@/lib/validation/auth';

export const POST = handle(async (req) => {
	const input = signupSchema.parse(await req.json());

	const taken = await db
		.select({ id: users.id })
		.from(users)
		.where(eq(users.email, input.email))
		.limit(1);
	if (taken.length > 0) throw new HttpError(409, 'email_taken');

	const [organization] = await db
		.select({ id: organizations.id })
		.from(organizations)
		.where(eq(organizations.id, input.organizationId))
		.limit(1);
	if (!organization) throw new HttpError(400, 'invalid_input');

	const id = crypto.randomUUID();
	const [user] = await db
		.insert(users)
		.values({
			id,
			slug: makeSlug(input.name, id),
			name: input.name,
			email: input.email,
			passwordHash: await Bun.password.hash(input.password),
			organizationId: organization.id,
			// role is not set here on purpose: the database default is "client"
		})
		.returning({
			id: users.id,
			slug: users.slug,
			name: users.name,
			email: users.email,
			role: users.role,
			organizationId: users.organizationId,
		});

	await createSession(user.id);
	return Response.json({ user }, { status: 201 });
});
