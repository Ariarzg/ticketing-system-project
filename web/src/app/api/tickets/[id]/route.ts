import { requireUser } from "@/lib/auth";
import { handle, uuidParam } from "@/lib/http";
import { getVisibleTicket, ticketFiles } from "@/lib/tickets";

export const GET = handle<{ params: Promise<{ id: string }> }>(async (_req, ctx) => {
  const user = await requireUser();
  const id = await uuidParam(ctx);
  const ticket = await getVisibleTicket(user, id);
  // The description's files: whoever sees the ticket sees them (D28).
  const files = await ticketFiles(id);
  return Response.json({ ticket: { ...ticket, attachments: files.get(null) ?? [] } });
});
