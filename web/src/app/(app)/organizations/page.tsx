// file: src/app/(app)/organizations/page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Chip, Skeleton, buttonVariants } from '@heroui/react';
import {
	BuildingsIcon,
	PencilSimpleIcon,
	PlusIcon,
	TrashIcon,
} from '@phosphor-icons/react';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { EmptyBox } from '@/components/EmptyBox';
import { LoadingButton } from '@/components/LoadingButton';
import { PageHeader } from '@/components/PageHeader';
import { formatDay } from '@/lib/dates';
import {
	useDeleteOrganization,
	useOrganizations,
	type OrganizationDto,
} from '@/lib/hooks/use-organizations';
import { useSupervisorOnly } from '@/lib/hooks/use-supervisor-only';
import { t } from '@/lib/strings.fa';

export default function OrganizationsPage() {
	const isSupervisor = useSupervisorOnly();
	const { data: organizations, isLoading } = useOrganizations();
	const remove = useDeleteOrganization();
	const [target, setTarget] = useState<OrganizationDto | null>(null);
	const [confirming, setConfirming] = useState(false);

	if (!isSupervisor) return null;

	return (
		<div className="flex flex-col gap-5">
			<PageHeader
				title={t.organizations.title}
				description={t.organizations.hint}
				actions={
					// A link, not a button: it navigates, so Ctrl/middle click opens it in a new tab.
					<Link
						href="/organizations/new"
						className={buttonVariants({ variant: 'primary' })}
					>
						<PlusIcon size={18} />
						{t.organizations.new}
					</Link>
				}
			/>

			{isLoading && (
				<div className="divide-y divide-separator overflow-hidden rounded-2xl border border-border bg-surface">
					{Array.from({ length: 3 }, (_, i) => (
						<div
							key={i}
							className="flex items-center gap-4 px-4 py-4"
						>
							<Skeleton className="size-10 rounded-full" />
							<div className="flex-1 space-y-2">
								<Skeleton className="h-4 w-40 rounded-lg" />
								<Skeleton className="h-3 w-24 rounded-lg" />
							</div>
						</div>
					))}
				</div>
			)}

			{organizations && organizations.length === 0 && (
				<div className="rounded-2xl border border-border bg-surface">
					<EmptyBox
						icon={<BuildingsIcon size={24} />}
						title={t.organizations.empty}
					/>
				</div>
			)}

			{organizations && organizations.length > 0 && (
				<ul className="divide-y divide-separator overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--surface-shadow)]">
					{organizations.map((o, index) => (
						<li
							key={o.id}
							className="rise flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3.5"
							style={{ '--i': Math.min(index, 8) } as React.CSSProperties}
						>
							<span className="grid size-10 shrink-0 place-items-center rounded-full bg-accent-soft text-accent-soft-foreground">
								<BuildingsIcon size={20} />
							</span>
							<div className="min-w-0 flex-1">
								<p className="flex items-center gap-2">
									{/* Own direction plus text-right: a Latin name stays on the right and truncates at its end. */}
									<span
										dir="auto"
										className="truncate text-right font-medium"
									>
										{o.name}
									</span>
									{o.isDefault && (
										<Chip
											size="sm"
											color="accent"
											variant="soft"
											className="shrink-0"
										>
											{t.organizations.default}
										</Chip>
									)}
								</p>
								<p className="mt-0.5 text-xs text-muted">
									{t.organizations.createdLabel}: {formatDay(o.createdAt)}
								</p>
							</div>
							<div className="flex shrink-0 items-center gap-2">
								<Link
									href={`/organizations/${o.id}`}
									className={buttonVariants({
										size: 'sm',
										variant: 'secondary',
									})}
								>
									<PencilSimpleIcon size={16} />
									{t.organizations.edit}
								</Link>
								{!o.isDefault && (
									<LoadingButton
										size="sm"
										variant="danger-soft"
										isIconOnly
										aria-label={`${t.organizations.delete}: ${o.name}`}
										isPending={remove.isPending && remove.variables === o.id}
										icon={<TrashIcon size={16} />}
										onPress={() => {
											setTarget(o);
											setConfirming(true);
										}}
									/>
								)}
							</div>
						</li>
					))}
				</ul>
			)}

			<ConfirmDialog
				isOpen={confirming}
				onOpenChange={setConfirming}
				title={t.organizations.deleteTitle}
				text={t.organizations.deleteText}
				confirmLabel={t.organizations.delete}
				onConfirm={() => target && remove.mutate(target.id)}
			/>
		</div>
	);
}
