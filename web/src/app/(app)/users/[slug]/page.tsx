// file: src/app/(app)/users/[slug]/page.tsx
'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Avatar, Skeleton, toast } from '@heroui/react';
import { ArrowRightIcon, TicketIcon } from '@phosphor-icons/react';
import { EmptyBox } from '@/components/EmptyBox';
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
	const { data, error } = useUserProfile(slug);

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
					className="inline-flex w-fit items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground"
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
						<span>{t.role[user.role]}</span>
						<span>
							{t.users.joined}: {formatDay(user.createdAt)}
						</span>
					</div>
				</div>
				{/* ms-auto: at the end of the row on wide screens; on a phone it wraps below the name. */}
				{me.role === 'supervisor' && isClientProfile && (
					<div className="ms-auto">
						<PromoteButton
							slug={user.slug}
							hasTickets={stats.total > 0}
						/>
					</div>
				)}
			</section>

			{isClientProfile || isAgentProfile ?
				<>
					<section className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-5">
						{[
							{ label: t.users.statTotal, value: stats.total, strong: true },
							...STATUSES.map((s) => ({
								label: t.status[s],
								value: stats[s],
								strong: false,
							})),
						].map((item) => (
							<div
								key={item.label}
								className="bg-surface px-4 py-4"
							>
								<p
									className={`text-2xl font-bold tabular-nums leading-none ${item.strong ? 'text-accent-soft-foreground' : ''}`}
								>
									{item.value.toLocaleString('fa-IR')}
								</p>
								<p className="mt-2 text-xs text-muted">{item.label}</p>
							</div>
						))}
					</section>

					{isClientProfile ?
						<section className="flex flex-col gap-3">
							<h2 className="text-lg font-bold">{t.users.ticketsOfUser}</h2>
							<TicketList
								tickets={tickets}
								showPriority={isStaff(me.role)}
								highlightAttention={isStaff(me.role)}
								empty={
									<EmptyBox
										icon={<TicketIcon size={24} />}
										title={t.tickets.empty}
									/>
								}
							/>
						</section>
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
									highlightAttention
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
			:	<p className="max-w-[65ch] rounded-2xl border border-border bg-surface p-4 text-sm leading-relaxed text-muted">
					{t.users.agentProfileHint}
				</p>
			}
		</div>
	);
}
