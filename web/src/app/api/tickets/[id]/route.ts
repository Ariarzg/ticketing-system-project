import { requireUser } from "@/lib/auth";
import { handle, uuidParam } from "@/lib/http";
import { getVisibleTicket } from "@/lib/tickets";

export const GET = handle<{ params: Promise<{ id: string }> }>(async (_req, ctx) => {
  const user = await requireUser();
  const id = await uuidParam(ctx);
  const ticket = await getVisibleTicket(user, id);
  return Response.json({ ticket });
});