import { index, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { DEPARTMENTS, PRIORITIES, ROLES, STATUSES } from "../lib/constants";

export const roleEnum = pgEnum("role", ROLES);
export const departmentEnum = pgEnum("department", DEPARTMENTS);
export const priorityEnum = pgEnum("priority", PRIORITIES);
export const statusEnum = pgEnum("status", STATUSES);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: roleEnum("role").notNull().default("client"),
  department: departmentEnum("department").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const tickets = pgTable(
  "tickets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description").notNull(),
    priority: priorityEnum("priority").notNull(),
    status: statusEnum("status").notNull().default("open"),
    department: departmentEnum("department").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("tickets_user_id_idx").on(table.userId),
    index("tickets_status_idx").on(table.status),
    index("tickets_updated_at_idx").on(table.updatedAt),
  ],
);

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ticketId: uuid("ticket_id")
      .notNull()
      .references(() => tickets.id, { onDelete: "cascade" }),
    authorId: uuid("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("messages_ticket_created_idx").on(table.ticketId, table.createdAt)],
);