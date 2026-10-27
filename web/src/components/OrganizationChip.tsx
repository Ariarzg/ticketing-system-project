'use client';

import { Chip } from '@heroui/react';
import { useOrganizationName } from '@/lib/hooks/use-organizations';

/** An organization's name for an id (D24). Shows "…" for the moment the list is loading. */
export function OrganizationName({ id }: { id: string }) {
	return <>{useOrganizationName(id) ?? '…'}</>;
}

export function OrganizationChip({ id }: { id: string }) {
	return (
		<Chip
			size="sm"
			color="default"
			variant="soft"
		>
			<OrganizationName id={id} />
		</Chip>
	);
}
