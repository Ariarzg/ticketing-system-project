import { getCurrentUser } from "@/lib/auth";
import { HttpError, handle } from "@/lib/http";

export const GET = handle(async () => {
  const user = await getCurrentUser();
  if (!user) throw new HttpError(401, "unauthorized");
  return Response.json({ user });
});