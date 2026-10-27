-- Custom SQL migration file, put your code below! --
-- v1.2.5: staff (agents and the supervisor) always belong to the default organization (D24).
UPDATE "users"
SET "organization_id" = (SELECT "id" FROM "organizations" WHERE "is_default" = true)
WHERE "role" IN ('agent', 'supervisor')
  AND "organization_id" <> (SELECT "id" FROM "organizations" WHERE "is_default" = true);
