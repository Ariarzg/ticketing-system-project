import { handle } from "@/lib/http";
import { destroySession } from "@/lib/session";

export const POST = handle(async () => {
  await destroySession();
  return Response.json({ ok: true });
});