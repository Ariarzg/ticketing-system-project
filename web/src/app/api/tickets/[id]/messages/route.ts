import { and, asc, eq, inArray, isNull, or } from "drizzle-orm";
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
  const client = user.role === "client";

  const rows = await db
    .select({
      id: messages.id,
      body: messages.body,
      createdAt: messages.createdAt,
      authorId: messages.authorId,
      authorName: users.name,
      authorRole: users.role,
      reviewStatus: messages.reviewStatus,
      editedBody: messages.editedBody,
      reviewNote: messages.reviewNote,
      reviewedAt: messages.reviewedAt,
    })
    .from(messages)
    .innerJoin(users, eq(messages.authorId, users.id))
    .where(
      and(
        eq(messages.ticketId, id),
        // A client sees only what reached them: messages that need no review, and replies the supervisor let through (D27).
        client ? or(isNull(messages.reviewStatus), inArray(messages.reviewStatus, ["confirmed", "changed"])) : undefined,
      ),
    )
    .orderBy(asc(messages.createdAt), asc(messages.id));

  const items = rows.map(({ reviewStatus, editedBody, reviewNote, reviewedAt, ...m }) =>
    client
      ? // The client reads the supervisor's version and is never told it was changed.
        { ...m, body: editedBody ?? m.body, review: null }
      : { ...m, review: reviewStatus ? { status: reviewStatus, editedBody, note: reviewNote, reviewedAt } : null },
  );

  return Response.json({ items });
});

export const POST = handle<Ctx>(async (req, ctx) => {
  const user = await requireUser();
  const id = await uuidParam(ctx);
  const { body } = messageSchema.parse(await req.json());
  // An agent's reply waits for the supervisor before the client sees it (D27).
  const reviewStatus = user.role === "agent" ? ("pending" as const) : null;

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
      .values({ ticketId: id, authorId: user.id, body, reviewStatus })
      .returning({
        id: messages.id,
        body: messages.body,
        createdAt: messages.createdAt,
        authorId: messages.authorId,
      });

    await tx.update(tickets).set({ status: nextStatus, updatedAt: new Date() }).where(eq(tickets.id, id));
    return created;
  });

  const review = reviewStatus ? { status: reviewStatus, editedBody: null, note: null, reviewedAt: null } : null;
  return Response.json(
    { message: { ...message, authorName: user.name, authorRole: user.role, review } },
    { status: 201 },
  );
});
