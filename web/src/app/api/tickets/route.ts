import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { tickets, users } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { HttpError, handle } from "@/lib/http";
import { ticketColumns, ticketScope } from "@/lib/tickets";
import { createTicketSchema } from "@/lib/validation/tickets";

export const GET = handle(async () => {
  const user = await requireUser();

  const items = await db
    .select(ticketColumns)
    .from(tickets)
    .innerJoin(users, eq(tickets.userId, users.id))
    .where(and(ticketScope(user)))
    .orderBy(desc(tickets.updatedAt), desc(tickets.id));

  return Response.json({ items });
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