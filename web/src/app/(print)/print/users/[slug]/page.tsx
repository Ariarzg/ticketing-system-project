'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { PrintSheet, ReportSections } from '@/components/PrintSheet';
import { api } from '@/lib/api-client';
import { profileSections, type ProfileExport } from '@/lib/reports';
import { t } from '@/lib/strings.fa';

/** A client's or an agent's report, to print or save as PDF (D30). */
export default function UserReportPage() {
	const { slug } = useParams<{ slug: string }>();
	const { data, error } = useQuery({
		queryKey: ['export', 'user', slug],
		queryFn: () => api<ProfileExport>(`/api/users/${slug}/export`),
	});
	return (
		<PrintSheet
			kind={
				data?.user.role === 'agent' ?
					t.exports.agentTitle
				:	t.exports.userTitle
			}
			title={data?.user.name}
			ready={!!data}
			failed={!!error}
		>
			{data && <ReportSections sections={profileSections(data)} />}
		</PrintSheet>
	);
}
