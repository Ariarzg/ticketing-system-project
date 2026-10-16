import { count, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { tickets, users } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { STATUSES } from "@/lib/constants";
import { HttpError, handle } from "@/lib/http";
import { ticketColumns } from "@/lib/tickets";

export const GET = handle<{ params: Promise<{ slug: string }> }>(async (_req, ctx) => {
  const me = await requireUser();
  const { slug } = await ctx.params;

  const [target] = await db
    .select({
      id: users.id,
      slug: users.slug,
      name: users.name,
      email: users.email,
      role: users.role,
      department: users.department,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.slug, slug))
    .limit(1);

  if (!target || (me.role !== "agent" && target.id !== me.id)) {
    throw new HttpError(404, "not_found");
  }

  const rows = await db
    .select({ status: tickets.status, n: count() })
    .from(tickets)
    .where(eq(tickets.userId, target.id))
    .groupBy(tickets.status);

  const stats = Object.fromEntries(STATUSES.map((s) => [s, 0])) as Record<(typeof STATUSES)[number], number>;
  for (const row of rows) stats[row.status] = row.n;
  const total = Object.values(stats).reduce((a, b) => a + b, 0);

  const userTickets = await db
    .select(ticketColumns)
    .from(tickets)
    .innerJoin(users, eq(tickets.userId, users.id))
    .where(eq(tickets.userId, target.id))
    .orderBy(desc(tickets.updatedAt), desc(tickets.id))
    .limit(50);

  return Response.json({ user: target, stats: { ...stats, total }, tickets: userTickets });
});