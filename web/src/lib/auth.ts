import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { readSessionUserId } from "./session";
import { HttpError } from "./http";

export async function getCurrentUser() {
  const id = await readSessionUserId();
  if (!id) return null;
  const [user] = await db
    .select({
      id: users.id,
      slug: users.slug,
      name: users.name,
      email: users.email,
      role: users.role,
      department: users.department,
    })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
  return user ?? null;
}

export type SessionUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

/** Layer 1: must be logged in, otherwise 401. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new HttpError(401, "unauthorized");
  return user;
}

/** Layer 2: must be an agent, otherwise 403. */
export async function requireAgent(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "agent") throw new HttpError(403, "forbidden");
  return user;
}