import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { tickets, users } from "@/db/schema";
import type { SessionUser } from "./auth";
import { HttpError } from "./http";
import { TransitionError, transition, type TicketAction } from "./lifecycle";
import type { Role, Status } from "./constants";

/** The columns every ticket response contains (ticket + author). */
export const ticketColumns = {
  id: tickets.id,
  title: tickets.title,
  description: tickets.description,
  priority: tickets.priority,
  status: tickets.status,
  department: tickets.department,
  createdAt: tickets.createdAt,
  updatedAt: tickets.updatedAt,
  authorId: tickets.userId,
  authorName: users.name,
  authorSlug: users.slug,
};

/** Layer 3 of D10: which tickets may this user touch at all? */
export function ticketScope(user: SessionUser) {
  return user.role === "agent" ? undefined : eq(tickets.userId, user.id);
}

/** One ticket the user is allowed to see, or a 404. */
export async function getVisibleTicket(user: SessionUser, id: string) {
  const [row] = await db
    .select(ticketColumns)
    .from(tickets)
    .innerJoin(users, eq(tickets.userId, users.id))
    .where(and(eq(tickets.id, id), ticketScope(user)))
    .limit(1);
  if (!row) throw new HttpError(404, "not_found");
  return row;
}

/** Runs the lifecycle function and turns its errors into HTTP errors. */
export function nextStatusOrHttpError(current: Status, action: TicketAction, role: Role): Status {
  try {
    return transition(current, action, role);
  } catch (e) {
    if (e instanceof TransitionError) {
      throw new HttpError(e.code === "forbidden" ? 403 : 409, e.code);
    }
    throw e;
  }
}