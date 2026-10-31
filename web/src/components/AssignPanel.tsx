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
	// The choice is permanent, so each agent shows how many active tickets they already have, the least busy first.
	const byLoad = [...(agents ?? [])].sort(
		(a, b) => a.activeTickets - b.activeTickets,
	);

	return (
		<div className="flex flex-col gap-3 border-t border-separator pt-4">
			<Autocomplete
				fullWidth
				selectionMode="single"
				placeholder={t.assign.agentPlaceholder}
				value={agentId}
				onChange={setAgentId}
			>
				<Label>{t.assign.agent}</Label>
				<Autocomplete.Trigger>
					{/* Only the name: an option also carries the agent's workload, which the field does not need. */}
					<Autocomplete.Value>
						{({ defaultChildren, isPlaceholder, selectedText }) =>
							isPlaceholder ? defaultChildren : selectedText
						}
					</Autocomplete.Value>
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
							{byLoad.map((agent) => (
								<ListBox.Item
									key={agent.id}
									id={agent.id}
									textValue={agent.name}
								>
									<span
										dir="auto"
										className="min-w-0 flex-1 truncate text-right"
									>
										{agent.name}
									</span>
									<span className="shrink-0 text-xs tabular-nums text-muted">
										{agent.activeTickets.toLocaleString('fa-IR')} {t.agents.colActive}
									</span>
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
