import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { messages, tickets, users } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { HttpError, handle, uuidParam } from "@/lib/http";
import { getVisibleTicket, nextStatusOrHttpError, ticketScope } from "@/lib/tickets";
import { messageSchema } from "@/lib/validation/tickets";

type Ctx = { params: Promise<{ id: string }> };

export const GET = handle<Ctx>(async (_req, ctx) => {
  const user = await requireUser();
  const id = await uuidParam(ctx);
  await getVisibleTicket(user, id); // 404 when the user may not see this ticket

  const items = await db
    .select({
      id: messages.id,
      body: messages.body,
      createdAt: messages.createdAt,
      authorId: messages.authorId,
      authorName: users.name,
      authorRole: users.role,
    })
    .from(messages)
    .innerJoin(users, eq(messages.authorId, users.id))
    .where(eq(messages.ticketId, id))
    .orderBy(asc(messages.createdAt), asc(messages.id));

  return Response.json({ items });
});

export const POST = handle<Ctx>(async (req, ctx) => {
  const user = await requireUser();
  const id = await uuidParam(ctx);
  const { body } = messageSchema.parse(await req.json());

  const message = await db.transaction(async (tx) => {
    const [ticket] = await tx
      .select({ id: tickets.id, status: tickets.status })
      .from(tickets)
      .where(and(eq(tickets.id, id), ticketScope(user)))
      .limit(1)
      .for("update");
    if (!ticket) throw new HttpError(404, "not_found");

    const nextStatus = nextStatusOrHttpError(ticket.status, { type: "reply" }, user.role);

    const [created] = await tx
      .insert(messages)
      .values({ ticketId: id, authorId: user.id, body })
      .returning({
        id: messages.id,
        body: messages.body,
        createdAt: messages.createdAt,
        authorId: messages.authorId,
      });

    await tx.update(tickets).set({ status: nextStatus, updatedAt: new Date() }).where(eq(tickets.id, id));
    return created;
  });

  return Response.json(
    { message: { ...message, authorName: user.name, authorRole: user.role } },
    { status: 201 },
  );
});