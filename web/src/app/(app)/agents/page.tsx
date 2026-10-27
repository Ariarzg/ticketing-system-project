// file: src/app/(app)/agents/page.tsx
'use client';

import { Suspense, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Avatar, Skeleton, toast } from '@heroui/react';
import { HeadsetIcon } from '@phosphor-icons/react';
import { DepartmentChip } from '@/components/chips';
import { EmptyBox } from '@/components/EmptyBox';
import { PageHeader } from '@/components/PageHeader';
import { SearchBox } from '@/components/SearchBox';
import { useMe } from '@/lib/hooks/use-me';
import { useAgents } from '@/lib/hooks/use-users';
import { initials } from '@/lib/initials';
import { t } from '@/lib/strings.fa';

export default function AgentsPage() {
	// useSearchParams needs a Suspense boundary.
	return (
		<Suspense fallback={null}>
			<AgentsView />
		</Suspense>
	);
}

function AgentsView() {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const { data: me } = useMe();
	const q = searchParams.get('q') ?? '';
	const isSupervisor = me?.role === 'supervisor';
	const { data: agents, isLoading } = useAgents(q, isSupervisor);
	// Strict Mode runs mount effects twice in dev; warn only once
	const warned = useRef(false);

	useEffect(() => {
		if (me && me.role !== 'supervisor' && !warned.current) {
			warned.current = true;
			toast.danger(t.errors.forbidden);
			router.replace('/tickets');
		}
	}, [me, router]);

	function setQ(value: string) {
		const next = value.trim();
		router.replace(
			next ? `${pathname}?q=${encodeURIComponent(next)}` : pathname,
		);
	}

	if (!isSupervisor) return null;

	return (
		<div className="flex flex-col gap-5">
			<PageHeader
				title={t.agents.title}
				description={t.agents.hint}
			/>
			<SearchBox
				className="w-full sm:w-80"
				value={q}
				onChange={setQ}
				label={t.users.search}
				placeholder={t.agents.searchPlaceholder}
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
								<Skeleton className="h-3 w-56 rounded-lg" />
							</div>
						</div>
					))}
				</div>
			)}

			{agents && agents.length === 0 && (
				<div className="rounded-2xl border border-border bg-surface">
					<EmptyBox
						icon={<HeadsetIcon size={24} />}
						title={t.agents.empty}
					/>
				</div>
			)}

			{agents && agents.length > 0 && (
				<div className="flex flex-col gap-2">
					<div
						aria-hidden
						className="hidden items-center gap-4 px-4 text-xs font-medium text-muted sm:flex"
					>
						<span className="flex-1">{t.users.colName}</span>
						<span className="w-24">{t.users.colDepartment}</span>
					</div>
					<ul className="divide-y divide-separator overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--surface-shadow)]">
						{agents.map((a, index) => (
							<li
								key={a.id}
								className="rise"
								style={{ '--i': Math.min(index, 8) } as React.CSSProperties}
							>
								<Link
									href={`/users/${a.slug}`}
									className="flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-surface-secondary focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus"
								>
									<Avatar
										color="accent"
										variant="soft"
									>
										<Avatar.Fallback>{initials(a.name)}</Avatar.Fallback>
									</Avatar>
									<div className="min-w-0 flex-1">
										{/* Own direction plus text-right: Latin names stay on the right and truncate at their end. */}
										<p
											dir="auto"
											className="truncate text-right font-medium"
										>
											{a.name}
										</p>
										<p
											dir="ltr"
											className="truncate text-right text-xs text-muted"
										>
											{a.email}
										</p>
										<div className="mt-1.5 sm:hidden">
											<DepartmentChip department={a.department} />
										</div>
									</div>
									<div className="hidden w-24 sm:block">
										<DepartmentChip department={a.department} />
									</div>
								</Link>
							</li>
						))}
					</ul>
				</div>
			)}
		</div>
	);
}
