'use client';

import { useState } from 'react';
import {
	Autocomplete,
	EmptyState,
	Label,
	ListBox,
	SearchField,
	useFilter,
	type Key,
} from '@heroui/react';
import { UserCheckIcon } from '@phosphor-icons/react';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { LoadingButton } from '@/components/LoadingButton';
import { SelectField } from '@/components/SelectField';
import { PRIORITIES, type Priority } from '@/lib/constants';
import { useAssignTicket } from '@/lib/hooks/use-assign';
import type { MeUser } from '@/lib/hooks/use-me';
import { useAgents } from '@/lib/hooks/use-users';
import { t } from '@/lib/strings.fa';

const priorityOptions = PRIORITIES.map((id) => ({
	id,
	label: t.priority[id],
}));

/** Supervisor only: picks the agent and the priority of an unassigned ticket, once (D25, D26). */
export function AssignPanel({ ticketId }: { ticketId: string }) {
	const { data: agents } = useAgents('', true);
	const { contains } = useFilter({ sensitivity: 'base' });
	const assign = useAssignTicket(ticketId);
	const [agentId, setAgentId] = useState<Key | null>(null);
	const [priority, setPriority] = useState<string | null>(null);
	const [confirming, setConfirming] = useState(false);
	const ready = agentId !== null && priority !== null;

	return (
		<div className="flex flex-col gap-3 border-t border-separator pt-4">
			<p className="text-xs font-medium text-muted">{t.assign.title}</p>
			<Autocomplete
				fullWidth
				variant="secondary"
				selectionMode="single"
				placeholder={t.assign.agentPlaceholder}
				value={agentId}
				onChange={setAgentId}
			>
				<Label>{t.assign.agent}</Label>
				<Autocomplete.Trigger>
					<Autocomplete.Value />
					<Autocomplete.ClearButton aria-label={t.assign.clear} />
					<Autocomplete.Indicator />
				</Autocomplete.Trigger>
				<Autocomplete.Popover>
					<Autocomplete.Filter filter={contains}>
						<SearchField
							autoFocus
							aria-label={t.assign.search}
							name="agent-search"
							variant="secondary"
						>
							<SearchField.Group>
								<SearchField.SearchIcon />
								<SearchField.Input
									dir="rtl"
									placeholder={t.assign.searchPlaceholder}
								/>
								<SearchField.ClearButton aria-label={t.filters.clearSearch} />
							</SearchField.Group>
						</SearchField>
						<ListBox
							renderEmptyState={() => (
								<EmptyState>{t.assign.noAgents}</EmptyState>
							)}
						>
							{(agents ?? []).map((agent) => (
								<ListBox.Item
									key={agent.id}
									id={agent.id}
									textValue={agent.name}
								>
									{agent.name}
									<ListBox.ItemIndicator />
								</ListBox.Item>
							))}
						</ListBox>
					</Autocomplete.Filter>
				</Autocomplete.Popover>
			</Autocomplete>
			<SelectField
				label={t.tickets.colPriority}
				placeholder={t.assign.priorityPlaceholder}
				value={priority}
				options={priorityOptions}
				onChange={setPriority}
			/>
			<LoadingButton
				size="sm"
				variant="primary"
				isDisabled={!ready}
				isPending={assign.isPending}
				icon={<UserCheckIcon size={16} />}
				onPress={() => setConfirming(true)}
			>
				{t.assign.submit}
			</LoadingButton>
			<ConfirmDialog
				isOpen={confirming}
				onOpenChange={setConfirming}
				title={t.assign.confirmTitle}
				text={t.assign.confirmText}
				confirmLabel={t.assign.submit}
				onConfirm={() => {
					if (ready)
						assign.mutate({
							agentId: String(agentId),
							priority: priority as Priority,
						});
				}}
			/>
		</div>
	);
}

/** The assigned agent's name: the agent reading their own ticket gets their own name, the supervisor looks it up. */
export function AssigneeName({ id, me }: { id: string; me: MeUser }) {
	const { data: agents } = useAgents('', me.role === 'supervisor');
	if (id === me.id) return <>{me.name}</>;
	return <>{agents?.find((a) => a.id === id)?.name ?? '…'}</>;
}
