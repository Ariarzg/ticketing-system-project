import { eq } from 'drizzle-orm';
import { tickets } from '@/db/schema';
import { requireSupervisor } from '@/lib/auth';
import { exportResponse, exportTickets } from '@/lib/exports';
import { handle, uuidParam } from '@/lib/http';
import { findOrganization, organizationMembers } from '@/lib/organizations';
import { organizationSections, type OrganizationExport } from '@/lib/reports';
import { ticketStats } from '@/lib/tickets';

/** Supervisor only: an organization's report (D30), with every member and every ticket. JSON, or CSV with `?format=csv`. */
export const GET = handle<{ params: Promise<{ id: string }> }>(
	async (req, ctx) => {
		await requireSupervisor();
		const id = await uuidParam(ctx);
		const organization = await findOrganization(id);
		const ofOrganization = eq(tickets.organizationId, id);

		const [members, stats, rows] = await Promise.all([
			organizationMembers(id),
			ticketStats(ofOrganization),
			exportTickets(ofOrganization, true),
		]);

		const data: OrganizationExport = {
			organization,
			stats,
			members,
			tickets: rows,
		};
		return exportResponse(
			req,
			data,
			organizationSections(data),
			organization.name,
		);
	},
);
