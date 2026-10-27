ALTER TABLE "tickets" ALTER COLUMN "priority" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN "assignee_id" uuid;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_assignee_id_users_id_fk" FOREIGN KEY ("assignee_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "tickets_assignee_id_idx" ON "tickets" USING btree ("assignee_id");--> statement-breakpoint
-- v1.3: only the supervisor sets the priority now, so existing unassigned tickets start as "not specified yet" (D26).
UPDATE "tickets" SET "priority" = NULL WHERE "assignee_id" IS NULL;