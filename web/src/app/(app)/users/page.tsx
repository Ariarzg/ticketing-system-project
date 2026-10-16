"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const { data: me } = useMe();
  const [q, setQ] = useState("");
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
        <ul className="divide-y divide-separator overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--surface-shadow)]">
          {users.map((u, index) => (
            <li key={u.id} className="rise" style={{ "--i": Math.min(index, 8) } as React.CSSProperties}>
              <Link
                href={`/users/${u.slug}`}
                className="flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-surface-secondary focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
              >
                <Avatar color="accent" variant="soft">
                  <Avatar.Fallback>{initials(u.name)}</Avatar.Fallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{u.name}</p>
                  <p className="truncate text-xs text-muted">
                    <bdi dir="ltr">{u.email}</bdi>
                  </p>
                </div>
                <DepartmentChip department={u.department} />
                <div className="w-20 text-end">
                  <p className="text-lg font-bold tabular-nums leading-none">{u.openTickets.toLocaleString("fa-IR")}</p>
                  <p className="mt-1 text-xs text-muted">{t.users.colOpen}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}