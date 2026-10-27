ALTER TABLE "tickets" RENAME COLUMN "organiztion_id" TO "organization_id";--> statement-breakpoint
ALTER TABLE "tickets" DROP CONSTRAINT "tickets_organiztion_id_organizations_id_fk";
--> statement-breakpoint
DROP INDEX "tickets_organization_id_idx";--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "tickets_organization_id_idx" ON "tickets" USING btree ("organization_id");