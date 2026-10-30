CREATE TYPE "public"."review_status" AS ENUM('pending', 'confirmed', 'changed', 'denied');--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "review_status" "review_status";--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "edited_body" text;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "review_note" text;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "reviewed_by_id" uuid;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "reviewed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_reviewed_by_id_users_id_fk" FOREIGN KEY ("reviewed_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;