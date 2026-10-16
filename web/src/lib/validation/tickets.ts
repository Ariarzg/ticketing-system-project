import { z } from "zod";
import { DEPARTMENTS, PRIORITIES, STATUSES } from "../constants";

export const createTicketSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().min(10).max(5000),
  priority: z.enum(PRIORITIES),
});

export const listQuerySchema = z.object({
  status: z.enum(STATUSES).optional(),
  priority: z.enum(PRIORITIES).optional(),
  department: z.enum(DEPARTMENTS).optional(),
  q: z.string().trim().max(100).optional(),
  attention: z.literal("1").optional(),
  page: z.coerce.number().int().min(1).default(1),
});

export const messageSchema = z.object({
  body: z.string().trim().min(1).max(5000),
});

export const statusSchema = z.object({
  status: z.enum(["in_progress", "answered", "closed"]),
});