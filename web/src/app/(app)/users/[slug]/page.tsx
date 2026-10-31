'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Avatar, Skeleton, toast } from '@heroui/react';
import { ArrowRightIcon, TicketIcon } from '@phosphor-icons/react';
import { EmptyBox } from '@/components/EmptyBox';
import { ExportButtons } from '@/components/ExportButtons';
import { LoadError } from '@/components/LoadError';
import { PromoteButton } from '@/components/PromoteButton';
import { TicketList } from '@/components/TicketList';
import { ApiError } from '@/lib/api-client';
import { STATUSES, isStaff } from '@/lib/constants';
import { formatDay } from '@/lib/dates';
import { useMe } from '@/lib/hooks/use-me';
import { useUserProfile } from '@/lib/hooks/use-users';
import { initials } from '@/lib/initials';
import { t } from '@/lib/strings.fa';
import { OrganizationChip } from '@/components/OrganizationChip';

export default function UserProfilePage() {
	const { slug } = useParams<{ slug: string }>();
	const router = useRouter();
	const { data: me } = useMe();
	const { data, error, refetch, isFetching } = useUserProfile(slug);

	useEffect(() => {
		if (error instanceof ApiError && error.status === 404 && me) {
			// Staff may see every profile, so for them a 404 really means "no such user" (D11 is about hiding from clients).
			toast.danger(
				isStaff(me.role) ? t.users.notFound : t.errors.notAuthorized,
			);
			router.replace(isStaff(me.role) ? '/users' : '/tickets');
		}
	}, [error, me, router]);

	// The profile is loaded in the browser, so its title cannot come from metadata (see the ticket page).
	const name = data?.user.name;
	useEffect(() => {
		if (!name) return;
		const before = document.title;
		document.title = `${name} · ${t.appName}`;
		return () => {
			document.title = before;
		};
	}, [name]);

	if (error && !(error instanceof ApiError && error.status === 404) && !data) {
		return (
			<LoadError
				onRetry={() => refetch()}
				retrying={isFetching}
			/>
		);
	}

	if (!data || !me) {
		return (
			<div className="space-y-5">
				<Skeleton className="h-20 w-full rounded-2xl" />
				<Skeleton className="h-24 w-full rounded-2xl" />
				<Skeleton className="h-64 w-full rounded-2xl" />
			</div>
		);
	}
	const { user, stats, tickets } = data;
	// A client's tickets are the ones they filed, an agent's the ones assigned to them (D29); the supervisor has none.
	const isClientProfile = user.role === 'client';
	const isAgentProfile = user.role === 'agent';
	// Your own tickets are on /tickets with their counts, so your own profile is only about the account.
	const own = user.id === me.id;
	const viewerIsAgent = me.role === 'agent';
	// Back to the list this profile is in: clients are in /users, agents in the supervisor's /agents (D23).
	const back =
		isStaff(me.role) && isClientProfile ?
			{ href: '/users', label: t.users.back }
		: me.role === 'supervisor' && user.role === 'agent' ?
			{ href: '/agents', label: t.agents.back }
		:	null;

	return (
		<div className="flex flex-col gap-6">
			{back && (
				<Link
					href={back.href}
					className="-my-2 inline-flex w-fit items-center gap-1.5 py-2 text-sm text-muted transition-colors hover:text-foreground"
				>
					<ArrowRightIcon size={16} />
					{back.label}
				</Link>
			)}

			<section className="flex flex-wrap items-center gap-4">
				<Avatar
					size="lg"
					color="accent"
					variant="soft"
				>
					<Avatar.Fallback>{initials(user.name)}</Avatar.Fallback>
				</Avatar>
				<div className="min-w-0">
					<h1
						dir="auto"
						className="text-right text-2xl font-bold tracking-tight break-words"
					>
						{user.name}
					</h1>
					<div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
						{/* break-all: an email has no spaces, so on a phone it would be cut off instead of wrapping. */}
						<span
							dir="ltr"
							className="break-all"
						>
							{user.email}
						</span>
						<OrganizationChip id={user.organizationId} />
						<span>
							{t.users.joined}: {formatDay(user.createdAt)}
						</span>
					</div>
				</div>
				{/* ms-auto: at the end of the row on wide screens; on a phone it wraps below the name. */}
				{(isClientProfile || isAgentProfile) && (
					<div className="ms-auto flex flex-wrap items-center gap-2">
						{/* The report holds what this viewer sees here (D30). */}
						<ExportButtons
							pdf={`/print/users/${user.slug}`}
							csv={`/api/users/${user.slug}/export?format=csv`}
						/>
						{me.role === 'supervisor' && isClientProfile && (
							<PromoteButton
								slug={user.slug}
								hasTickets={stats.total > 0}
							/>
						)}
					</div>
				)}
			</section>

			{!own && (isClientProfile || isAgentProfile) && (
				<>
					{/* One line of counts: the list below holds the tickets themselves. */}
					<ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
						{[
							{ label: t.users.statTotal, value: stats.total },
							...STATUSES.map((s) => ({ label: t.status[s], value: stats[s] })),
						].map((item) => (
							<li
								key={item.label}
								className="flex items-baseline gap-1.5"
							>
								<span className="text-lg font-bold tabular-nums text-foreground">
									{item.value.toLocaleString('fa-IR')}
								</span>
								{item.label}
							</li>
						))}
					</ul>

					{isClientProfile ?
						<TicketList
							tickets={tickets}
							showPriority={isStaff(me.role)}
							showAssignee={me.role === 'supervisor'}
							highlightAttention={viewerIsAgent}
							empty={
								<EmptyBox
									icon={<TicketIcon size={24} />}
									title={t.tickets.empty}
								/>
							}
						/>
					:	[
							{
								title: t.users.activeTickets,
								items: tickets.filter((x) => x.status !== 'closed'),
								empty: t.users.noActive,
							},
							{
								title: t.users.closedTickets,
								items: tickets.filter((x) => x.status === 'closed'),
								empty: t.users.noClosed,
							},
						].map((s) => (
							<section
								key={s.title}
								className="flex flex-col gap-3"
							>
								<h2 className="text-lg font-bold">{s.title}</h2>
								{/* An agent's tickets come from many clients, so each row names its author. */}
								<TicketList
									tickets={s.items}
									showAuthor
									showPriority
									highlightAttention={viewerIsAgent}
									empty={
										<EmptyBox
											icon={<TicketIcon size={24} />}
											title={s.empty}
										/>
									}
								/>
							</section>
						))
					}
				</>
			)}
		</div>
	);
}
