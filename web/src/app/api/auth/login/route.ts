import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { HttpError, handle } from "@/lib/http";
import { createSession } from "@/lib/session";
import { loginSchema } from "@/lib/validation/auth";

export const POST = handle(async (req) => {
  const input = loginSchema.parse(await req.json());

  const [row] = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
  const ok = row ? await Bun.password.verify(input.password, row.passwordHash) : false;
  // Same message for "no such email" and "wrong password", so attackers learn nothing.
  if (!row || !ok) throw new HttpError(401, "invalid_credentials");

  await createSession(row.id);
  return Response.json({
    user: {
      id: row.id,
      slug: row.slug,
      name: row.name,
      email: row.email,
      role: row.role,
      department: row.department,
    },
  });
});