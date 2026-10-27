import { db } from './index';
import { users } from './schema';
import { makeSlug } from '../lib/slug';

const SUPERVISOR = {
	name: 'مدیر پشتیبانی',
	email: 'supervisor@ticketing.com',
	password: 'Supervisor@1234',
};

async function main() {
	const host = new URL(process.env.DATABASE_URL!).hostname;
	console.log(`Target database host: ${host}`);

	const id = crypto.randomUUID();
	const inserted = await db
		.insert(users)
		.values({
			id,
			slug: makeSlug('supervisor', id),
			name: SUPERVISOR.name,
			email: SUPERVISOR.email,
			passwordHash: await Bun.password.hash(SUPERVISOR.password),
			role: 'supervisor',
			department: 'general',
		})
		.onConflictDoNothing({ target: users.email })
		.returning({ id: users.id });

	console.log(
		inserted.length > 0 ?
			`Created agent ${SUPERVISOR.email} (password ${SUPERVISOR.password}).`
		:	`Agent ${SUPERVISOR.email} already exists, nothing changed.`,
	);
	process.exit(0);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
