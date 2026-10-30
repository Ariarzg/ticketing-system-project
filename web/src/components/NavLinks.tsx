// file: src/components/NavLinks.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
	BuildingsIcon,
	HeadsetIcon,
	PlusCircleIcon,
	TicketIcon,
	UserCircleIcon,
	UsersThreeIcon,
} from '@phosphor-icons/react';
import { isStaff } from '@/lib/constants';
import type { MeUser } from '@/lib/hooks/use-me';
import { useUserProfile } from '@/lib/hooks/use-users';
import { t } from '@/lib/strings.fa';

export function NavLinks({
	me,
	onNavigate,
}: {
	me: MeUser;
	onNavigate?: () => void;
}) {
	const pathname = usePathname();
	// Someone else's profile belongs to "Users", except that the supervisor reaches an agent's profile from
	// "Agents". The profile page loads the same query, so reading the role here costs no extra request.
	const otherProfile =
		pathname.startsWith('/users/') && pathname !== `/users/${me.slug}`;
	const { data: profile } = useUserProfile(
		decodeURIComponent(pathname.slice('/users/'.length)),
		otherProfile && me.role === 'supervisor',
	);
	const profileTab =
		!otherProfile ? null
		: me.role !== 'supervisor' ? 'users'
		: !profile ? null // still loading: light neither tab rather than the wrong one
		: profile.user.role === 'agent' ? 'agents'
		: 'users';

	const items = [
		{
			href: '/tickets',
			label: t.nav.tickets,
			icon: TicketIcon,
			match: (p: string) => p === '/tickets' || /^\/tickets\/(?!new)/.test(p),
		},
		...(me.role === 'client' ?
			[
				{
					href: '/tickets/new',
					label: t.nav.newTicket,
					icon: PlusCircleIcon,
					match: (p: string) => p === '/tickets/new',
				},
			]
		:	[]),
		...(isStaff(me.role) ?
			[
				{
					href: '/users',
					label: t.nav.users,
					icon: UsersThreeIcon,
					// Your own profile is "My profile".
					match: (p: string) => p === '/users' || profileTab === 'users',
				},
			]
		:	[]),
		...(me.role === 'supervisor' ?
			[
				{
					href: '/agents',
					label: t.nav.agents,
					icon: HeadsetIcon,
					match: (p: string) => p === '/agents' || profileTab === 'agents',
				},
				{
					href: '/organizations',
					label: t.nav.organizations,
					icon: BuildingsIcon,
					match: (p: string) =>
						p === '/organizations' || p.startsWith('/organizations/'),
				},
			]
		:	[]),
		{
			href: `/users/${me.slug}`,
			label: t.nav.myProfile,
			icon: UserCircleIcon,
			match: (p: string) => p === `/users/${me.slug}`,
		},
	];

	return (
		<nav
			aria-label={t.nav.label}
			className="flex flex-col gap-1"
		>
			{items.map(({ href, label, icon: Icon, match }) => {
				const active = match(pathname);
				return (
					<Link
						key={href}
						href={href}
						onClick={onNavigate}
						aria-current={active ? 'page' : undefined}
						className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
							active ?
								'bg-accent-soft text-accent-soft-foreground'
							:	'text-muted hover:bg-surface-secondary hover:text-foreground'
						}`}
					>
						<Icon
							size={20}
							weight={active ? 'fill' : 'regular'}
						/>
						{label}
					</Link>
				);
			})}
		</nav>
	);
}
