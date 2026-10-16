import type { Role, Status } from "./constants";

export type TicketAction = { type: "reply" } | { type: "set_status"; to: Status };

export type TransitionErrorCode = "ticket_closed" | "forbidden" | "invalid_transition";

export class TransitionError extends Error {
  constructor(public code: TransitionErrorCode) {
    super(code);
  }
}

/** Statuses an agent may set by hand. "open" is only the starting status. */
const AGENT_TARGETS: Status[] = ["in_progress", "answered", "closed"];

export function transition(current: Status, action: TicketAction, role: Role): Status {
  if (current === "closed") throw new TransitionError("ticket_closed");

  if (action.type === "reply") {
    return role === "agent" ? "answered" : "in_progress";
  }

  if (role !== "agent") throw new TransitionError("forbidden");
  if (!AGENT_TARGETS.includes(action.to) || action.to === current) {
    throw new TransitionError("invalid_transition");
  }
  return action.to;
}