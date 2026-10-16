"use client";

import { Suspense, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Avatar, Skeleton, toast } from "@heroui/react";
import { UsersThreeIcon } from "@phosphor-icons/react";
import { DepartmentChip } from "@/components/chips";
import { EmptyBox } from "@/components/EmptyBox";
import { PageHeader } from "@/components/PageHeader";
import { SearchBox } from "@/components/SearchBox";
import { useMe } from "@/lib/hooks/use-me";
import { useUsers } from "@/lib/hooks/use-users";
import { initials } from "@/lib/initials";
import { t } from "@/lib/strings.fa";

export default function UsersPage() {
  // useSearchParams needs a Suspense boundary.
  return (
    <Suspense fallback={null}>
      <UsersView />
    </Suspense>
  );
}

function UsersView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: me } = useMe();
  // The search lives in the URL, so it survives a reload and the back button.
  const q = searchParams.get("q") ?? "";
  const isAgent = me?.role === "agent";
  const { data: users, isLoading } = useUsers(q, isAgent);
  // Strict Mode runs mount effects twice in dev; warn only once
  const warned = useRef(false);

  useEffect(() => {
    if (me && me.role !== "agent" && !warned.current) {
      warned.current = true;
      toast.danger(t.errors.forbidden);
      router.replace("/tickets");
    }
  }, [me, router]);

  function setQ(value: string) {
    const next = value.trim();
    router.replace(next ? `${pathname}?q=${encodeURIComponent(next)}` : pathname);
  }

  if (!isAgent) return null;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title={t.users.title} description={t.users.hint} />
      <SearchBox
        className="w-full sm:w-80"
        value={q}
        onChange={setQ}
        label={t.users.search}
        placeholder={t.users.searchPlaceholder}
      />

      {isLoading && (
        <div className="divide-y divide-separator overflow-hidden rounded-2xl border border-border bg-surface">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-4">
              <Skeleton className="size-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-40 rounded-lg" />
                <Skeleton className="h-3 w-56 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      )}

      {users && users.length === 0 && (
        <div className="rounded-2xl border border-border bg-surface">
          <EmptyBox icon={<UsersThreeIcon size={24} />} title={t.users.empty} />
        </div>
      )}

      {users && users.length > 0 && (
        <div className="flex flex-col gap-2">
          {/* Column names for wide screens; on phones each row says what its number is. */}
          <div aria-hidden className="hidden items-center gap-4 px-4 text-xs font-medium text-muted sm:flex">
            <span className="flex-1">{t.users.colName}</span>
            <span className="w-24">{t.users.colDepartment}</span>
            <span className="w-20 text-end">{t.users.colOpen}</span>
          </div>
          <ul className="divide-y divide-separator overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--surface-shadow)]">
            {users.map((u, index) => (
              <li key={u.id} className="rise" style={{ "--i": Math.min(index, 8) } as React.CSSProperties}>
                <Link
                  href={`/users/${u.slug}`}
                  className="flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-surface-secondary focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus"
                >
                  <Avatar color="accent" variant="soft">
                    <Avatar.Fallback>{initials(u.name)}</Avatar.Fallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    {/* Own direction plus text-right: Latin names stay on the right and truncate at their end. */}
                    <p dir="auto" className="truncate text-right font-medium">
                      {u.name}
                    </p>
                    <p dir="ltr" className="truncate text-right text-xs text-muted">
                      {u.email}
                    </p>
                    <div className="mt-1.5 sm:hidden">
                      <DepartmentChip department={u.department} />
                    </div>
                  </div>
                  <div className="hidden w-24 sm:block">
                    <DepartmentChip department={u.department} />
                  </div>
                  <div className="w-20 shrink-0 text-end">
                    <p
                      className={`text-lg tabular-nums leading-none ${u.openTickets > 0 ? "font-bold" : "text-muted"}`}
                    >
                      {u.openTickets.toLocaleString("fa-IR")}
                    </p>
                    <p className="mt-1 text-xs text-muted sm:sr-only">{t.users.colOpen}</p>
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
