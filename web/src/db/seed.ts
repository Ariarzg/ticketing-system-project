import { db } from "./index";
import { users } from "./schema";
import { makeSlug } from "../lib/slug";

const AGENT = { name: "تیم پشتیبانی", email: "agent@ticketing.com", password: "Agent@1234" };

async function main() {
  const host = new URL(process.env.DATABASE_URL!).hostname;
  console.log(`Target database host: ${host}`);

  const id = crypto.randomUUID();
  const inserted = await db
    .insert(users)
    .values({
      id,
      slug: makeSlug("agent", id),
      name: AGENT.name,
      email: AGENT.email,
      passwordHash: await Bun.password.hash(AGENT.password),
      role: "agent",
      department: "general",
    })
    .onConflictDoNothing({ target: users.email })
    .returning({ id: users.id });

  console.log(
    inserted.length > 0
      ? `Created agent ${AGENT.email} (password ${AGENT.password}).`
      : `Agent ${AGENT.email} already exists, nothing changed.`,
  );
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});