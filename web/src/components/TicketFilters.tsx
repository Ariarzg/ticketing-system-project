'use client';

import { Tabs } from '@heroui/react';
import { PRIORITIES, STATUSES, type Status } from '@/lib/constants';
import { useOrganizations } from '@/lib/hooks/use-organizations';
import { t } from '@/lib/strings.fa';
import { SearchBox } from './SearchBox';
import { SelectField } from './SelectField';

const priorityOptions = [
	{ id: 'all', label: t.filters.allPriorities },
	...PRIORITIES.map((id) => ({ id, label: t.priority[id] })),
];

/** The views besides the status tabs. Each is its own URL flag (?attention=1, ?unassigned=1, ?review=1); only one is on at a time. */
const VIEW_FLAGS = ['attention', 'unassigned', 'review'] as const;
const isViewFlag = (key: string) =>
	(VIEW_FLAGS as readonly string[]).includes(key);

export function TicketFilters({
	params,
	setParams,
	isAgent,
	isSupervisor,
	statusCounts,
	attentionCount,
	unassignedCount,
	reviewCount,
}: {
	params: URLSearchParams;
	/** Changes several URL parameters in one navigation. A null value removes the parameter. */
	setParams: (updates: Record<string, string | null>) => void;
	/** True for all staff (agents and the supervisor). */
	isAgent: boolean;
	isSupervisor: boolean;
	/** Undefined while the list loads, so the tabs show no number instead of a false zero. */
	statusCounts?: Record<Status, number>;
	attentionCount?: number;
	unassignedCount?: number;
	reviewCount?: number;
}) {
	const { data: organizations } = useOrganizations();
	const organizationOptions = [
		{ id: 'all', label: t.filters.allOrganizations },
		...(organizations ?? []).map((o) => ({ id: o.id, label: o.name })),
	];
	const view =
		VIEW_FLAGS.find((flag) => params.get(flag) === '1') ??
		params.get('status') ??
		'all';
	const total =
		statusCounts ?
			STATUSES.reduce((sum, s) => sum + statusCounts[s], 0)
		:	undefined;
	const pick = (key: string) => (value: string) =>
		setParams({ [key]: value === 'all' ? null : value });

	// A view flag clears the status and the other flags; a status tab clears every flag.
	function selectView(key: string) {
		setParams({
			...Object.fromEntries(
				VIEW_FLAGS.map((flag) => [flag, flag === key ? '1' : null]),
			),
			status: isViewFlag(key) || key === 'all' ? null : key,
		});
	}

	const tabs: { id: string; label: string; count?: number }[] = [
		...(isSupervisor ?
			[
				{
					id: 'unassigned',
					label: t.filters.unassigned,
					count: unassignedCount,
				},
				{ id: 'review', label: t.filters.review, count: reviewCount },
			]
		:	[]),
		...(isAgent ?
			[{ id: 'attention', label: t.filters.attention, count: attentionCount }]
		:	[]),
		{ id: 'all', label: t.filters.all, count: total },
		...STATUSES.map((s) => ({
			id: s,
			label: t.status[s],
			count: statusCounts?.[s],
		})),
	];

	return (
		<div className="flex flex-col gap-3">
			{/* Six tabs do not fit a phone, and HeroUI's scroll arrows are labelled in English, so small screens get a select. */}
			<SelectField
				className="md:hidden"
				label={t.filters.viewLabel}
				hideLabel
				value={view}
				options={tabs.map((tab) => ({
					id: tab.id,
					label:
						tab.count === undefined ?
							tab.label
						:	`${tab.label} (${tab.count.toLocaleString('fa-IR')})`,
				}))}
				onChange={selectView}
			/>
			<Tabs
				className="hidden md:block"
				selectedKey={view}
				onSelectionChange={(key) => selectView(String(key))}
			>
				<Tabs.ListContainer className="overflow-x-auto">
					<Tabs.List aria-label={t.filters.viewLabel}>
						{tabs.map((tab) => (
							<Tabs.Tab
								key={tab.id}
								id={tab.id}
								className="whitespace-nowrap"
							>
								{tab.label}
								{tab.count !== undefined && (
									<span className="ms-2 text-xs tabular-nums text-muted">
										{tab.count.toLocaleString('fa-IR')}
									</span>
								)}
								<Tabs.Indicator />
							</Tabs.Tab>
						))}
					</Tabs.List>
				</Tabs.ListContainer>
			</Tabs>

			<div className="flex flex-wrap items-center gap-3">
				<SearchBox
					className="w-full sm:w-80"
					value={params.get('q') ?? ''}
					onChange={(v) => setParams({ q: v.trim() || null })}
					label={t.filters.search}
					placeholder={
						isAgent ?
							t.filters.searchAgentPlaceholder
						:	t.filters.searchClientPlaceholder
					}
				/>
				{/* Clients never see the priority, so they get no priority filter (D26). */}
				{isAgent && (
					<SelectField
						hideLabel
						className="min-w-36 flex-1 sm:w-44 sm:flex-none"
						label={t.tickets.colPriority}
						value={params.get('priority') ?? 'all'}
						options={priorityOptions}
						onChange={pick('priority')}
					/>
				)}
				{isAgent && (
					<SelectField
						hideLabel
						className="min-w-36 flex-1 sm:w-52 sm:flex-none"
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
