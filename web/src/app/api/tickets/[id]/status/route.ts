import { eq } from "drizzle-orm";
import { db } from "@/db";
import { tickets } from "@/db/schema";
import { requireAgent } from "@/lib/auth";
import { HttpError, handle, uuidParam } from "@/lib/http";
import { nextStatusOrHttpError } from "@/lib/tickets";
import { statusSchema } from "@/lib/validation/tickets";

export const PATCH = handle<{ params: Promise<{ id: string }> }>(async (req, ctx) => {
  const user = await requireAgent();
  const id = await uuidParam(ctx);
  const { status } = statusSchema.parse(await req.json());

  await db.transaction(async (tx) => {
    const [ticket] = await tx
      .select({ status: tickets.status })
      .from(tickets)
      .where(eq(tickets.id, id))
      .limit(1)
      .for("update");
    if (!ticket) throw new HttpError(404, "not_found");

    const next = nextStatusOrHttpError(ticket.status, { type: "set_status", to: status }, user.role);
    await tx.update(tickets).set({ status: next, updatedAt: new Date() }).where(eq(tickets.id, id));
  });

  return Response.json({ ok: true });
});