'use client';

import { useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Skeleton, toast } from '@heroui/react';
import { OrganizationForm } from '@/components/OrganizationForm';
import { PageHeader } from '@/components/PageHeader';
import {
	useOrganizations,
	useSaveOrganization,
} from '@/lib/hooks/use-organizations';
import { useSupervisorOnly } from '@/lib/hooks/use-supervisor-only';
import { t } from '@/lib/strings.fa';

export default function EditOrganizationPage() {
	const { id } = useParams<{ id: string }>();
	const router = useRouter();
	const isSupervisor = useSupervisorOnly();
	const { data: organizations } = useOrganizations();
	const organization = organizations?.find((o) => o.id === id);
	const save = useSaveOrganization(id);
	// Strict Mode runs mount effects twice in dev; warn only once
	const warned = useRef(false);

	useEffect(() => {
		if (organizations && !organization && !warned.current) {
			warned.current = true;
			toast.danger(t.organizations.notFound);
			router.replace('/organizations');
		}
	}, [organizations, organization, router]);

	if (!isSupervisor) return null;
	if (!organization) return <Skeleton className="h-40 max-w-2xl rounded-2xl" />;

	return (
		<div className="max-w-2xl">
			<PageHeader title={t.organizations.editTitle} />
			<OrganizationForm
				key={organization.id}
				initialName={organization.name}
				submitLabel={t.organizations.save}
				isPending={save.isPending}
				cancelHref={`/organizations/${id}`}
				onSubmit={(name) =>
					save.mutate(name, {
						onSuccess: () => router.push(`/organizations/${id}`),
					})
				}
			/>
		</div>
	);
}
