import { requireUser } from '@/lib/auth';
import { isStaff } from '@/lib/constants';
import { agentStats, exportResponse, exportTickets } from '@/lib/exports';
import { handle } from '@/lib/http';
import { profileScope } from '@/lib/profiles';
import { profileSections, type ProfileExport } from '@/lib/reports';
import { ticketStats } from '@/lib/tickets';

/**
 * A client's or an agent's report (D30), for whoever may open that profile, with the same ticket scope:
 * an agent's export of a client holds only that agent's tickets. JSON, or CSV with `?format=csv`.
 */
export const GET = handle<{ params: Promise<{ slug: string }> }>(
	async (req, ctx) => {
		const me = await requireUser();
		const { slug } = await ctx.params;
		const { target, ofTarget, agentProfile } = await profileScope(me, slug);
		const staffView = isStaff(me.role);

		const [stats, rows, agent] = await Promise.all([
			ticketStats(ofTarget),
			exportTickets(ofTarget, staffView),
			agentProfile ? agentStats(target.id) : null,
		]);

		const data: ProfileExport = {
			user: {
				name: target.name,
				email: target.email,
				role: target.role,
				organizationName: target.organizationName,
				createdAt: target.createdAt,
			},
			stats,
			agentStats: agent,
			tickets: rows,
			staffView,
		};
		return exportResponse(req, data, profileSections(data), target.name);
	},
);
