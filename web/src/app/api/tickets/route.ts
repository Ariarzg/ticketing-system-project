import { and, count, desc, eq, ilike, inArray, or } from "drizzle-orm";
import { db } from "@/db";
import { tickets, users } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { ATTENTION_STATUSES, PAGE_SIZE, STATUSES } from "@/lib/constants";
import { HttpError, handle } from "@/lib/http";
import { likePattern } from "@/lib/search";
import { ticketColumns, ticketScope } from "@/lib/tickets";
import { createTicketSchema, listQuerySchema } from "@/lib/validation/tickets";

export const GET = handle(async (req) => {
  const user = await requireUser();
  const query = listQuerySchema.parse(Object.fromEntries(new URL(req.url).searchParams));
  const isAgent = user.role === "agent";

  const search = query.q
    ? isAgent
      ? or(ilike(tickets.title, likePattern(query.q)), ilike(users.name, likePattern(query.q)))
      : ilike(tickets.title, likePattern(query.q))
    : undefined;

  const where = and(
    ticketScope(user), // D10 layer 3 is always applied
    query.status ? eq(tickets.status, query.status) : undefined,
    query.priority ? eq(tickets.priority, query.priority) : undefined,
    query.department ? eq(tickets.department, query.department) : undefined,
    query.attention ? inArray(tickets.status, [...ATTENTION_STATUSES]) : undefined,
    search,
  );

  const [items, [{ total }]] = await Promise.all([
    db
      .select(ticketColumns)
      .from(tickets)
      .innerJoin(users, eq(tickets.userId, users.id))
      .where(where)
      .orderBy(desc(tickets.updatedAt), desc(tickets.id))
      .limit(PAGE_SIZE)
      .offset((query.page - 1) * PAGE_SIZE),
    db.select({ total: count() }).from(tickets).innerJoin(users, eq(tickets.userId, users.id)).where(where),
  ]);

  // Counts per status for the tabs. They follow the user's scope but ignore the filters, so every tab always shows its own total.
  const countRows = await db
    .select({ status: tickets.status, n: count() })
    .from(tickets)
    .where(ticketScope(user))
    .groupBy(tickets.status);
  const statusCounts = Object.fromEntries(STATUSES.map((s) => [s, 0])) as Record<(typeof STATUSES)[number], number>;
  for (const row of countRows) statusCounts[row.status] = row.n;
  const attentionCount = ATTENTION_STATUSES.reduce((sum, s) => sum + statusCounts[s], 0);

  return Response.json({ items, total, page: query.page, pageSize: PAGE_SIZE, statusCounts, attentionCount });
});

export const POST = handle(async (req) => {
  const user = await requireUser();
  if (user.role !== "client") throw new HttpError(403, "forbidden");

  const input = createTicketSchema.parse(await req.json());

  const [ticket] = await db
    .insert(tickets)
    .values({
      userId: user.id,
      title: input.title,
      description: input.description,
      priority: input.priority,
      department: user.department, // D7: copied from the user
    })
    .returning({ id: tickets.id });

  return Response.json({ id: ticket.id }, { status: 201 });
});