'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Skeleton, toast } from '@heroui/react';
import { ArrowRightIcon } from '@phosphor-icons/react';
import { ExportButtons } from '@/components/ExportButtons';
import { LoadError } from '@/components/LoadError';
import { Thread } from '@/components/Thread';
import { TicketInfo, TicketSummary } from '@/components/TicketInfo';
import { ApiError } from '@/lib/api-client';
import { isStaff } from '@/lib/constants';
import { useMe } from '@/lib/hooks/use-me';
import { useTicket } from '@/lib/hooks/use-tickets';
import { t } from '@/lib/strings.fa';

export default function TicketPage() {
	const { id } = useParams<{ id: string }>();
	const router = useRouter();
	const { data: me } = useMe();
	const { data: ticket, error, refetch, isFetching } = useTicket(id);
	const notFound = error instanceof ApiError && error.status === 404;

	useEffect(() => {
		if (notFound) {
			toast.danger(t.errors.notAuthorized);
			router.replace('/tickets');
		}
	}, [notFound, router]);

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

	if (error && !notFound && !ticket) {
		return (
			<LoadError
				onRetry={() => refetch()}
				retrying={isFetching}
			/>
		);
	}

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
		// A client has no facts panel, so the conversation keeps a readable line length instead of the full width.
		<div className={`flex flex-col gap-5 ${staff ? '' : 'max-w-3xl'}`}>
			<div>
				<div className="flex flex-wrap items-center justify-between gap-3">
					<Link
						href="/tickets"
						className="-my-2 inline-flex items-center gap-1.5 py-2 text-sm text-muted transition-colors hover:text-foreground"
					>
						<ArrowRightIcon size={16} />
						{t.tickets.back}
					</Link>
					<ExportButtons pdf={`/print/tickets/${ticket.id}`} />
				</div>
				{/* dir="auto" keeps an English title in its own order; text-right keeps it on the page's side. */}
				<h1
					dir="auto"
					className="mt-3 text-right text-2xl font-bold leading-snug tracking-tight text-balance break-words"
				>
					{ticket.title}
				</h1>
				{/* Staff read these facts in the panel on wide screens; on a phone the panel comes after the thread. */}
				<TicketSummary
					ticket={ticket}
					me={me}
					className={`mt-2 ${staff ? 'lg:hidden' : ''}`}
				/>
			</div>

			{staff ?
				<div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-start">
					<Thread
						ticket={ticket}
						me={me}
					/>
					{/* It stays in view along a long thread, so the status buttons are always in reach. */}
					<div className="lg:sticky lg:top-6">
						<TicketInfo
							ticket={ticket}
							me={me}
						/>
					</div>
				</div>
			:	<Thread
					ticket={ticket}
					me={me}
				/>
			}
		</div>
	);
}
