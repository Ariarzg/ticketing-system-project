import { eq } from 'drizzle-orm';
import { db } from './index';
import { organizations, users } from './schema';
import { makeSlug } from '../lib/slug';

const DEFAULT_ORGANIZATION = 'آفتاب آسا جنوب';
const SUPERVISOR = {
	name: 'مدیر پشتیبانی',
	email: 'supervisor@ticketing.com',
	password: 'Supervisor@1234',
};

async function main() {
	const host = new URL(process.env.DATABASE_URL!).hostname;
	console.log(`Target database host: ${host}`);

	let [organization] = await db
		.select({ id: organizations.id, name: organizations.name })
		.from(organizations)
		.where(eq(organizations.isDefault, true))
		.limit(1);
	if (organization) {
		console.log(`Default organization "${organization.name}" already exists.`);
	} else {
		[organization] = await db
			.insert(organizations)
			.values({ name: DEFAULT_ORGANIZATION, isDefault: true })
			.returning({ id: organizations.id, name: organizations.name });
		console.log(`Created default organization "${organization.name}".`);
	}

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
			organizationId: organization.id,
		})
		.onConflictDoNothing({ target: users.email })
		.returning({ id: users.id });

	console.log(
		inserted.length > 0 ?
			`Created supervisor ${SUPERVISOR.email} (password ${SUPERVISOR.password}).`
		:	`Supervisor ${SUPERVISOR.email} already exists, nothing changed.`,
	);
	process.exit(0);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
