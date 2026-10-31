'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Chip, Skeleton, buttonVariants } from '@heroui/react';
import {
	BuildingsIcon,
	PlusIcon,
	TrashIcon,
} from '@phosphor-icons/react';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { EmptyBox } from '@/components/EmptyBox';
import { LoadingButton } from '@/components/LoadingButton';
import { PageHeader } from '@/components/PageHeader';
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
							className="px-4 py-4"
						>
							<Skeleton className="h-4 w-40 rounded-lg" />
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
					{organizations.map((o) => (
						// The whole row opens the organization's page (D29), where it is also renamed; only delete stays here.
						<li
							key={o.id}
							className="relative flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-surface-secondary"
						>
							<p className="flex min-w-0 flex-1 items-center gap-2">
								{/* The link's ::after covers the row. Own direction plus text-right: a Latin name stays on the right and truncates at its end. */}
								<Link
									href={`/organizations/${o.id}`}
									dir="auto"
									className="truncate text-right font-medium after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-focus"
								>
									{o.name}
								</Link>
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
							<div className="relative flex shrink-0 items-center">
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
