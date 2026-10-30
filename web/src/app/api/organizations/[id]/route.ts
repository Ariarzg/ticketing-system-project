// file: src/app/api/organizations/[id]/route.ts
import { and, desc, eq, ne } from 'drizzle-orm';
import { db } from '@/db';
import { organizations, tickets, users } from '@/db/schema';
import { requireSupervisor } from '@/lib/auth';
import { HttpError, handle, uuidParam } from '@/lib/http';
import { findOrganization, organizationMembers } from '@/lib/organizations';
import { ticketColumns } from '@/lib/tickets';
import { organizationSchema } from '@/lib/validation/organizations';

type Ctx = { params: Promise<{ id: string }> };

/** Supervisor only: one organization's page, with its active tickets and everyone in it (D29). */
export const GET = handle<Ctx>(async (_req, ctx) => {
	await requireSupervisor();
	const id = await uuidParam(ctx);
	const organization = await findOrganization(id);

	const [activeTickets, members] = await Promise.all([
		db
			.select(ticketColumns)
			.from(tickets)
			.innerJoin(users, eq(tickets.userId, users.id))
			.where(and(eq(tickets.organizationId, id), ne(tickets.status, 'closed')))
			.orderBy(desc(tickets.updatedAt), desc(tickets.id))
			// shortcut: no paging past 100 active tickets; add it if an organization ever outgrows that.
			.limit(100),
		organizationMembers(id),
	]);

	return Response.json({ organization, tickets: activeTickets, users: members });
});

/** Supervisor only: renames an organization. The default one can be renamed too. */
export const PATCH = handle<Ctx>(async (req, ctx) => {
	await requireSupervisor();
	const id = await uuidParam(ctx);
	const { name } = organizationSchema.parse(await req.json());

	const [taken] = await db
		.select({ id: organizations.id })
		.from(organizations)
		.where(and(eq(organizations.name, name), ne(organizations.id, id)))
		.limit(1);
	if (taken) throw new HttpError(409, 'org_name_taken');

	const updated = await db
		.update(organizations)
		.set({ name })
		.where(eq(organizations.id, id))
		.returning({ id: organizations.id });
	if (updated.length === 0) throw new HttpError(404, 'not_found');
	return Response.json({ ok: true });
});

/** Supervisor only: deletes an organization; its users and tickets move to the default one (D24). */
export const DELETE = handle<Ctx>(async (_req, ctx) => {
	await requireSupervisor();
	const id = await uuidParam(ctx);

	await db.transaction(async (tx) => {
		const [organization] = await tx
			.select({ isDefault: organizations.isDefault })
			.from(organizations)
			.where(eq(organizations.id, id))
			.limit(1)
			.for('update');
		if (!organization) throw new HttpError(404, 'not_found');
		if (organization.isDefault) throw new HttpError(409, 'org_is_default');

		const [fallback] = await tx
			.select({ id: organizations.id })
			.from(organizations)
			.where(eq(organizations.isDefault, true))
			.limit(1);
		await tx
			.update(users)
			.set({ organizationId: fallback.id })
			.where(eq(users.organizationId, id));
		await tx
			.update(tickets)
			.set({ organizationId: fallback.id })
			.where(eq(tickets.organizationId, id));
		await tx.delete(organizations).where(eq(organizations.id, id));
	});

	return Response.json({ ok: true });
});
