CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organizations_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN "organiztion_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "organiztion_id" uuid NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "organizations_one_default_idx" ON "organizations" USING btree ("is_default") WHERE is_default = true;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_organiztion_id_organizations_id_fk" FOREIGN KEY ("organiztion_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_organiztion_id_organizations_id_fk" FOREIGN KEY ("organiztion_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "tickets_organization_id_idx" ON "tickets" USING btree ("organiztion_id");--> statement-breakpoint
ALTER TABLE "tickets" DROP COLUMN "department";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "department";--> statement-breakpoint
DROP TYPE "public"."department";