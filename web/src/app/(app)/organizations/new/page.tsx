'use client';

import { useRouter } from 'next/navigation';
import { OrganizationForm } from '@/components/OrganizationForm';
import { PageHeader } from '@/components/PageHeader';
import { useSaveOrganization } from '@/lib/hooks/use-organizations';
import { useSupervisorOnly } from '@/lib/hooks/use-supervisor-only';
import { t } from '@/lib/strings.fa';

export default function NewOrganizationPage() {
	const router = useRouter();
	const isSupervisor = useSupervisorOnly();
	const save = useSaveOrganization();

	if (!isSupervisor) return null;

	return (
		<div className="max-w-2xl">
			<PageHeader
				title={t.organizations.newTitle}
				description={t.organizations.newHint}
			/>
			<OrganizationForm
				submitLabel={t.organizations.create}
				isPending={save.isPending}
				onSubmit={(name) =>
					save.mutate(name, { onSuccess: () => router.push('/organizations') })
				}
			/>
		</div>
	);
}
