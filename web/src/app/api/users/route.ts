import { and, asc, eq, ilike, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { tickets, users } from "@/db/schema";
import { requireAgent } from "@/lib/auth";
import { handle } from "@/lib/http";
import { likePattern } from "@/lib/search";

const querySchema = z.object({ q: z.string().trim().max(100).optional() });

export const GET = handle(async (req) => {
  await requireAgent();
  const { q } = querySchema.parse(Object.fromEntries(new URL(req.url).searchParams));

  const items = await db
    .select({
      id: users.id,
      slug: users.slug,
      name: users.name,
      email: users.email,
      department: users.department,
      createdAt: users.createdAt,
      openTickets: sql<number>`count(${tickets.id}) filter (where ${tickets.status} <> 'closed')`.mapWith(Number),
    })
    .from(users)
    .leftJoin(tickets, eq(tickets.userId, users.id))
    .where(and(eq(users.role, "client"), q ? ilike(users.name, likePattern(q)) : undefined))
    .groupBy(users.id)
    .orderBy(asc(users.name))
    .limit(200);

  return Response.json({ items });
});