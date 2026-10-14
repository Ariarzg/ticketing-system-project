export const ROLES = ["client", "agent"] as const;
export const DEPARTMENTS = ["technical", "billing", "general"] as const;
export const PRIORITIES = ["low", "medium", "high"] as const;
export const STATUSES = ["open", "in_progress", "answered", "closed"] as const;

/** Statuses where the ticket is waiting for the agent (D4). */
export const ATTENTION_STATUSES = ["open", "in_progress"] as const;

export const PAGE_SIZE = 10;

export type Role = (typeof ROLES)[number];
export type Department = (typeof DEPARTMENTS)[number];
export type Priority = (typeof PRIORITIES)[number];
export type Status = (typeof STATUSES)[number];
