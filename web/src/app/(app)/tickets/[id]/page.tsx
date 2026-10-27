// file: src/app/(app)/tickets/[id]/page.tsx
'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Skeleton, toast } from '@heroui/react';
import { ArrowRightIcon } from '@phosphor-icons/react';
import { StatusChip } from '@/components/chips';
import { Thread } from '@/components/Thread';
import { TicketInfo } from '@/components/TicketInfo';
import { ApiError } from '@/lib/api-client';
import { isStaff } from '@/lib/constants';
import { useMe } from '@/lib/hooks/use-me';
import { useTicket } from '@/lib/hooks/use-tickets';
import { t } from '@/lib/strings.fa';

export default function TicketPage() {
	const { id } = useParams<{ id: string }>();
	const router = useRouter();
	const { data: me } = useMe();
	const { data: ticket, error } = useTicket(id);

	useEffect(() => {
		if (error instanceof ApiError && error.status === 404) {
			toast.danger(t.errors.notAuthorized);
			router.replace('/tickets');
		}
	}, [error, router]);

	// The ticket is loaded in the browser, so its title cannot come from metadata. The old title comes back on
	// leave: the list shares this page's metadata title, so Next would not reset it.
	const title = ticket?.title;
	useEffect(() => {
		if (!title) return;
		const before = document.title;
		document.title = `${title} · ${t.appName}`;
		return () => {
			document.title = before;
		};
	}, [title]);

	if (!ticket || !me) {
		return (
			<div className="space-y-4">
				<Skeleton className="h-4 w-32 rounded-lg" />
				<Skeleton className="h-9 w-2/3 rounded-xl" />
				<Skeleton className="h-96 w-full rounded-2xl" />
			</div>
		);
	}

	const staff = isStaff(me.role);

	return (
		<div className="flex flex-col gap-5">
			<div>
				<Link
					href="/tickets"
					className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground"
				>
					<ArrowRightIcon size={16} />
					{t.tickets.back}
				</Link>
				{/* dir="auto" keeps an English title in its own order; text-right keeps it on the page's side. */}
				<h1
					dir="auto"
					className="mt-3 text-right text-2xl font-bold leading-snug tracking-tight break-words"
				>
					{ticket.title}
				</h1>
				{/* Clients read the conversation first on a phone, so the facts panel moves below it; this line keeps the status in view. */}
				{!staff && (
					<div className="mt-2 flex items-center gap-2 lg:hidden">
						{/* No priority: clients never see it (D26). */}
						<StatusChip
							status={ticket.status}
							withLabel
						/>
					</div>
				)}
			</div>

			{/* For staff the facts panel comes first on small screens, so the status buttons are visible without scrolling. */}
			<div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-start">
				<div className={staff ? 'order-2 lg:order-1' : 'order-1'}>
					<Thread
						ticket={ticket}
						me={me}
					/>
				</div>
				<div className={staff ? 'order-1 lg:order-2' : 'order-2'}>
					<TicketInfo
						ticket={ticket}
						me={me}
					/>
				</div>
			</div>
		</div>
	);
}
