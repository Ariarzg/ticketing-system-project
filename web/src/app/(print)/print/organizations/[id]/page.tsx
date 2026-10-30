'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { PrintSheet, ReportSections } from '@/components/PrintSheet';
import { api } from '@/lib/api-client';
import { organizationSections, type OrganizationExport } from '@/lib/reports';
import { t } from '@/lib/strings.fa';

/** Supervisor only: an organization's report, to print or save as PDF (D30). */
export default function OrganizationReportPage() {
	const { id } = useParams<{ id: string }>();
	const { data, error } = useQuery({
		queryKey: ['export', 'organization', id],
		queryFn: () =>
			api<OrganizationExport>(`/api/organizations/${id}/export`),
	});
	return (
		<PrintSheet
			kind={t.exports.organizationTitle}
			title={data?.organization.name}
			ready={!!data}
			failed={!!error}
		>
			{data && <ReportSections sections={organizationSections(data)} />}
		</PrintSheet>
	);
}
