import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { messages, tickets, users } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { HttpError, handle, uuidParam } from "@/lib/http";
import { readBody, saveFiles } from "@/lib/storage";
import { deliveredToClient, getVisibleTicket, nextStatusOrHttpError, ticketFiles, ticketScope } from "@/lib/tickets";
import { messageSchema } from "@/lib/validation/tickets";

type Ctx = { params: Promise<{ id: string }> };

export const GET = handle<Ctx>(async (_req, ctx) => {
  const user = await requireUser();
  const id = await uuidParam(ctx);
  await getVisibleTicket(user, id); // 404 when the user may not see this ticket
  const client = user.role === "client";

  const [rows, files] = await Promise.all([
    db
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
      // A client sees only what reached them (D27).
      .where(and(eq(messages.ticketId, id), client ? deliveredToClient : undefined))
      .orderBy(asc(messages.createdAt), asc(messages.id)),
    ticketFiles(id),
  ]);

  const items = rows.map(({ reviewStatus, editedBody, reviewNote, reviewedAt, ...m }) => {
    // Only the files of messages in this list go out, so a client never sees a hidden reply's files (D28).
    const attachments = files.get(m.id) ?? [];
    return client
      ? // The client reads the supervisor's version and is never told it was changed.
        { ...m, body: editedBody ?? m.body, review: null, attachments }
      : {
          ...m,
          review: reviewStatus ? { status: reviewStatus, editedBody, note: reviewNote, reviewedAt } : null,
          attachments,
        };
  });

  return Response.json({ items });
});

export const POST = handle<Ctx>(async (req, ctx) => {
  const user = await requireUser();
  const id = await uuidParam(ctx);
  const { fields, files } = await readBody(req);
  const { body } = messageSchema.parse(fields);
  // Text, files, or both, but not nothing (D28).
  if (!body && files.length === 0) throw new HttpError(400, "invalid_input");
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

    // Checked before any upload: a closed ticket or a supervisor's reply stores nothing.
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

    const attachments = await saveFiles(tx, files, { ticketId: id, messageId: created.id });
    await tx.update(tickets).set({ status: nextStatus, updatedAt: new Date() }).where(eq(tickets.id, id));
    return { ...created, attachments };
  });

  const review = reviewStatus ? { status: reviewStatus, editedBody: null, note: null, reviewedAt: null } : null;
  return Response.json(
    { message: { ...message, authorName: user.name, authorRole: user.role, review } },
    { status: 201 },
  );
});
