ALTER TABLE "users" RENAME COLUMN "organiztion_id" TO "organization_id";--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "users_organiztion_id_organizations_id_fk";
--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;