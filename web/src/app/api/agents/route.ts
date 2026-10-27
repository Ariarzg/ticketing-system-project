// file: src/app/api/agents/route.ts
import { and, asc, eq, ilike } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { users } from '@/db/schema';
import { requireSupervisor } from '@/lib/auth';
import { handle } from '@/lib/http';
import { likePattern } from '@/lib/search';

const querySchema = z.object({ q: z.string().trim().max(100).optional() });

/** Supervisor only (D23): the list of agents. */
export const GET = handle(async (req) => {
	await requireSupervisor();
	const { q } = querySchema.parse(
		Object.fromEntries(new URL(req.url).searchParams),
	);

	const items = await db
		.select({
			id: users.id,
			slug: users.slug,
			name: users.name,
			email: users.email,
			organizationId: users.organizationId,
			createdAt: users.createdAt,
		})
		.from(users)
		.where(
			and(
				eq(users.role, 'agent'),
				q ? ilike(users.name, likePattern(q)) : undefined,
			),
		)
		.orderBy(asc(users.name))
		.limit(200);

	return Response.json({ items });
});
