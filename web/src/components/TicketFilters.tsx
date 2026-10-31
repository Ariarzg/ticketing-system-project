'use client';

import { Tabs } from '@heroui/react';
import {
	PRIORITIES,
	STATUSES,
	isStaff,
	type Role,
	type Status,
} from '@/lib/constants';
import { useOrganizations } from '@/lib/hooks/use-organizations';
import { t } from '@/lib/strings.fa';
import { SearchBox } from './SearchBox';
import { SelectField } from './SelectField';

const priorityOptions = [
	{ id: 'all', label: t.filters.allPriorities },
	...PRIORITIES.map((id) => ({ id, label: t.priority[id] })),
];

/** The work queues (D20). Each is its own URL flag (?attention=1, ?unassigned=1, ?review=1); only one is on at a time. */
const VIEW_FLAGS = ['attention', 'unassigned', 'review'] as const;

/**
 * The tabs are the viewer's work queues: the supervisor's "no agent yet" and "waiting for approval", the agent's
 * "needs a reply". The status is a filter like the others, so the tabs stay few. Clients have no queues.
 */
export function TicketFilters({
	params,
	setParams,
	role,
	statusCounts,
	attentionCount,
	unassignedCount,
	reviewCount,
}: {
	params: URLSearchParams;
	/** Changes several URL parameters in one navigation. A null value removes the parameter. */
	setParams: (updates: Record<string, string | null>) => void;
	role: Role;
	/** Undefined while the list loads, so nothing shows a false zero. */
	statusCounts?: Record<Status, number>;
	attentionCount?: number;
	unassignedCount?: number;
	reviewCount?: number;
}) {
	const staff = isStaff(role);
	const { data: organizations } = useOrganizations();
	const organizationOptions = [
		{ id: 'all', label: t.filters.allOrganizations },
		...(organizations ?? []).map((o) => ({ id: o.id, label: o.name })),
	];
	const view = VIEW_FLAGS.find((flag) => params.get(flag) === '1') ?? 'all';
	const status = params.get('status') as Status | null;
	const pick = (key: string) => (value: string) =>
		setParams({ [key]: value === 'all' ? null : value });

	// The status counts follow the search, priority and organization but not the queue, so they only show under "all".
	const statusOptions = [
		{ id: 'all', label: t.filters.allStatuses },
		...STATUSES.map((s) => ({
			id: s,
			label:
				statusCounts && view === 'all' ?
					`${t.status[s]} (${statusCounts[s].toLocaleString('fa-IR')})`
				:	t.status[s],
		})),
	];
	const allCount =
		statusCounts &&
		(status ? statusCounts[status] : STATUSES.reduce((sum, s) => sum + statusCounts[s], 0));
	const queues: { id: string; label: string; count?: number }[] =
		role === 'supervisor' ?
			[
				{ id: 'all', label: t.filters.all, count: allCount },
				{ id: 'unassigned', label: t.filters.unassigned, count: unassignedCount },
				{ id: 'review', label: t.filters.review, count: reviewCount },
			]
		: role === 'agent' ?
			[
				{ id: 'all', label: t.filters.all, count: allCount },
				{ id: 'attention', label: t.filters.attention, count: attentionCount },
			]
		:	[];

	return (
		<div className="flex flex-col gap-3">
			{queues.length > 0 && (
				<Tabs
					selectedKey={view}
					onSelectionChange={(key) =>
						setParams(
							Object.fromEntries(
								VIEW_FLAGS.map((flag) => [flag, flag === key ? '1' : null]),
							),
						)
					}
				>
					<Tabs.ListContainer>
						<Tabs.List aria-label={t.filters.viewLabel}>
							{queues.map((queue) => (
								<Tabs.Tab
									key={queue.id}
									id={queue.id}
									className="whitespace-nowrap"
								>
									{queue.label}
									{queue.count !== undefined && (
										<span className="ms-2 text-xs tabular-nums text-muted">
											{queue.count.toLocaleString('fa-IR')}
										</span>
									)}
									<Tabs.Indicator />
								</Tabs.Tab>
							))}
						</Tabs.List>
					</Tabs.ListContainer>
				</Tabs>
			)}

			<div className="flex flex-wrap items-center gap-3">
				<SearchBox
					className="w-full sm:w-72"
					value={params.get('q') ?? ''}
					onChange={(v) => setParams({ q: v.trim() || null })}
					label={t.filters.search}
					placeholder={
						staff ?
							t.filters.searchAgentPlaceholder
						:	t.filters.searchClientPlaceholder
					}
				/>
				<SelectField
					hideLabel
					className="min-w-36 flex-1 sm:w-44 sm:flex-none"
					label={t.tickets.colStatus}
					value={status ?? 'all'}
					options={statusOptions}
					onChange={pick('status')}
				/>
				{/* Clients never see the priority, so they get no priority filter (D26). */}
				{staff && (
					<SelectField
						hideLabel
						className="min-w-36 flex-1 sm:w-40 sm:flex-none"
						label={t.tickets.colPriority}
						value={params.get('priority') ?? 'all'}
						options={priorityOptions}
						onChange={pick('priority')}
					/>
				)}
				{staff && (
					<SelectField
						hideLabel
						className="min-w-36 flex-1 sm:w-48 sm:flex-none"
						label={t.tickets.colOrganization}
						value={params.get('organization') ?? 'all'}
						options={organizationOptions}
						onChange={pick('organization')}
					/>
				)}
			</div>
		</div>
	);
}
