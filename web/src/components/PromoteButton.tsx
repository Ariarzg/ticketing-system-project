'use client';

import { useState } from 'react';
import { UserGearIcon } from '@phosphor-icons/react';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { LoadingButton } from '@/components/LoadingButton';
import { usePromote } from '@/lib/hooks/use-promote';
import { t } from '@/lib/strings.fa';

/** Supervisor only (D23): turns a client without tickets into an agent. */
export function PromoteButton({
	slug,
	hasTickets,
}: {
	slug: string;
	hasTickets: boolean;
}) {
	const promote = usePromote(slug);
	const [confirming, setConfirming] = useState(false);

	// Only a client without tickets can become an agent (D23); the /agents page says so once.
	if (hasTickets) return null;

	return (
		<>
			<LoadingButton
				size="sm"
				variant="secondary"
				isPending={promote.isPending}
				icon={<UserGearIcon size={16} />}
				onPress={() => setConfirming(true)}
			>
				{t.users.promote}
			</LoadingButton>
			<ConfirmDialog
				isOpen={confirming}
				onOpenChange={setConfirming}
				title={t.users.promoteTitle}
				text={t.users.promoteText}
				confirmLabel={t.users.promote}
				onConfirm={() => promote.mutate()}
			/>
		</>
	);
}
