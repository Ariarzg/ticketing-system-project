'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Avatar, Chip, Skeleton, buttonVariants, toast } from '@heroui/react';
import {
	ArrowRightIcon,
	PencilSimpleIcon,
	TicketIcon,
	UsersIcon,
} from '@phosphor-icons/react';
import { EmptyBox } from '@/components/EmptyBox';
import { ExportButtons } from '@/components/ExportButtons';
import { PageHeader } from '@/components/PageHeader';
import { TicketList, TicketListSkeleton } from '@/components/TicketList';
import { ApiError } from '@/lib/api-client';
import { isStaff } from '@/lib/constants';
import { useOrganization } from '@/lib/hooks/use-organizations';
import { useSupervisorOnly } from '@/lib/hooks/use-supervisor-only';
import { initials } from '@/lib/initials';
import { t } from '@/lib/strings.fa';

/** Supervisor only: one organization, with its active tickets and everyone in it (D29). Editing is at ./edit. */
export default function OrganizationPage() {
	const { id } = useParams<{ id: string }>();
	const router = useRouter();
	const isSupervisor = useSupervisorOnly();
	const { data, error } = useOrganization(id, isSupervisor);
	// Strict Mode runs mount effects twice in dev; warn only once
	const warned = useRef(false);

	useEffect(() => {
		if (error instanceof ApiError && error.status === 404 && !warned.current) {
			warned.current = true;
			toast.danger(t.organizations.notFound);
			router.replace('/organizations');
		}
	}, [error, router]);

	if (!isSupervisor) return null;

	return (
		<div className="flex flex-col gap-6">
			<Link
				href="/organizations"
				className="inline-flex w-fit items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground"
			>
				<ArrowRightIcon size={16} />
				{t.organizations.back}
			</Link>

			{!data ?
				<>
					<Skeleton className="h-9 w-64 rounded-lg" />
					<TicketListSkeleton rows={3} />
				</>
			:	<>
					<PageHeader
						title={
							<span className="flex items-center gap-2">
								<span dir="auto">{data.organization.name}</span>
								{data.organization.isDefault && (
									<Chip
										size="sm"
										color="accent"
										variant="soft"
									>
										{t.organizations.default}
									</Chip>
								)}
							</span>
						}
						actions={
							<div className="flex flex-wrap items-center gap-2">
								<ExportButtons
									pdf={`/print/organizations/${id}`}
									csv={`/api/organizations/${id}/export?format=csv`}
								/>
								<Link
									href={`/organizations/${id}/edit`}
									className={buttonVariants({ size: 'sm', variant: 'secondary' })}
								>
									<PencilSimpleIcon size={16} />
									{t.organizations.edit}
								</Link>
							</div>
						}
					/>

					<section className="flex flex-col gap-3">
						<h2 className="text-lg font-bold">
							{t.organizations.activeTickets}
							<span className="ms-2 text-sm font-normal text-muted tabular-nums">
								{data.tickets.length.toLocaleString('fa-IR')}
							</span>
						</h2>
						<TicketList
							tickets={data.tickets}
							showAuthor
							showPriority
							highlightAttention
							empty={
								<EmptyBox
									icon={<TicketIcon size={24} />}
									title={t.organizations.noActive}
								/>
							}
						/>
					</section>

					<section className="flex flex-col gap-3">
						<h2 className="text-lg font-bold">
							{t.organizations.members}
							<span className="ms-2 text-sm font-normal text-muted tabular-nums">
								{data.users.length.toLocaleString('fa-IR')}
							</span>
						</h2>
						{data.users.length === 0 ?
							<div className="rounded-2xl border border-border bg-surface">
								<EmptyBox
									icon={<UsersIcon size={24} />}
									title={t.organizations.noMembers}
								/>
							</div>
						:	<ul className="divide-y divide-separator overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--surface-shadow)]">
								{data.users.map((u) => (
									<li key={u.id}>
										<Link
											href={`/users/${u.slug}`}
											className="flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-surface-secondary focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus"
										>
											<Avatar
												color={isStaff(u.role) ? 'accent' : 'default'}
												variant="soft"
											>
												<Avatar.Fallback>{initials(u.name)}</Avatar.Fallback>
											</Avatar>
											<div className="min-w-0 flex-1">
												{/* Own direction plus text-right: Latin names stay on the right and truncate at their end. */}
												<p
													dir="auto"
													className="truncate text-right font-medium"
												>
													{u.name}
												</p>
												<p
													dir="ltr"
													className="truncate text-right text-xs text-muted"
												>
													{u.email}
												</p>
											</div>
											<Chip
												size="sm"
												color={isStaff(u.role) ? 'accent' : 'default'}
												variant="soft"
												className="shrink-0"
											>
												{t.role[u.role]}
											</Chip>
										</Link>
									</li>
								))}
							</ul>
						}
					</section>
				</>
			}
		</div>
	);
}
