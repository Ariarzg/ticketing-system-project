import {
	boolean,
	index,
	integer,
	pgEnum,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid,
} from 'drizzle-orm/pg-core';
import {
	PRIORITIES,
	REVIEW_STATUSES,
	ROLES,
	STATUSES,
} from '../lib/constants';
import { sql } from 'drizzle-orm';

export const roleEnum = pgEnum('role', ROLES);
export const priorityEnum = pgEnum('priority', PRIORITIES);
export const statusEnum = pgEnum('status', STATUSES);
export const reviewEnum = pgEnum('review_status', REVIEW_STATUSES);

export const organizations = pgTable(
	'organizations',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		name: text('name').notNull().unique(),
		isDefault: boolean('is_default').notNull().default(false),
		createdAt: timestamp('created_at', { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(table) => [
		uniqueIndex('organizations_one_default_idx')
			.on(table.isDefault)
			.where(sql`is_default = true`),
	],
);

export const users = pgTable('users', {
	id: uuid('id').defaultRandom().primaryKey(),
	slug: text('slug').notNull().unique(),
	name: text('name').notNull(),
	email: text('email').notNull().unique(),
	passwordHash: text('password_hash').notNull(),
	role: roleEnum('role').notNull().default('client'),
	organizationId: uuid('organization_id')
		.notNull()
		.references(() => organizations.id),
	createdAt: timestamp('created_at', { withTimezone: true })
		.notNull()
		.defaultNow(),
});

export const tickets = pgTable(
	'tickets',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		userId: uuid('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		title: text('title').notNull(),
		description: text('description').notNull(),
		// Null until the supervisor sets it while assigning the ticket ("not specified yet", D26).
		priority: priorityEnum('priority'),
		status: statusEnum('status').notNull().default('open'),
		organizationId: uuid('organization_id')
			.notNull()
			.references(() => organizations.id),
		// The agent the supervisor assigned; null until then (D25).
		assigneeId: uuid('assignee_id').references(() => users.id),
		createdAt: timestamp('created_at', { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(table) => [
		index('tickets_user_id_idx').on(table.userId),
		index('tickets_status_idx').on(table.status),
		index('tickets_updated_at_idx').on(table.updatedAt),
		index('tickets_organization_id_idx').on(table.organizationId),
		index('tickets_assignee_id_idx').on(table.assigneeId),
	],
);

export const messages = pgTable(
	'messages',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		ticketId: uuid('ticket_id')
			.notNull()
			.references(() => tickets.id, { onDelete: 'cascade' }),
		authorId: uuid('author_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		body: text('body').notNull(),
		// Null: no review needed (client replies, and agent replies from before v1.4). D27.
		reviewStatus: reviewEnum('review_status'),
		// The supervisor's version, sent to the client instead of `body` when the status is "changed".
		editedBody: text('edited_body'),
		// Why the supervisor denied the reply; staff only.
		reviewNote: text('review_note'),
		reviewedById: uuid('reviewed_by_id').references(() => users.id),
		reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
		createdAt: timestamp('created_at', { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(table) => [
		index('messages_ticket_created_idx').on(table.ticketId, table.createdAt),
	],
);

export const attachments = pgTable(
	'attachments',
	{
		// Set by the API before the upload, because the file's key in the bucket is built from it (D28).
		id: uuid('id').primaryKey(),
		ticketId: uuid('ticket_id')
			.notNull()
			.references(() => tickets.id, { onDelete: 'cascade' }),
		// Null: the file belongs to the ticket's description, the first bubble of the thread (D17).
		messageId: uuid('message_id').references(() => messages.id, {
			onDelete: 'cascade',
		}),
		// The name the file had on the user's computer: shown in the thread and used when it is saved.
		name: text('name').notNull(),
		type: text('type').notNull(),
		size: integer('size').notNull(),
		createdAt: timestamp('created_at', { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(table) => [index('attachments_ticket_id_idx').on(table.ticketId)],
);
