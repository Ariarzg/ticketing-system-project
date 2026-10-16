"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Avatar, Skeleton, toast } from "@heroui/react";
import { ArrowRightIcon, TicketIcon } from "@phosphor-icons/react";
import { DepartmentChip } from "@/components/chips";
import { EmptyBox } from "@/components/EmptyBox";
import { TicketList } from "@/components/TicketList";
import { ApiError } from "@/lib/api-client";
import { STATUSES } from "@/lib/constants";
import { formatDate } from "@/lib/dates";
import { useMe } from "@/lib/hooks/use-me";
import { useUserProfile } from "@/lib/hooks/use-users";
import { initials } from "@/lib/initials";
import { t } from "@/lib/strings.fa";

export default function UserProfilePage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { data: me } = useMe();
  const { data, error } = useUserProfile(slug);

  useEffect(() => {
    if (error instanceof ApiError && error.status === 404) {
      toast.danger(t.errors.notAuthorized);
      router.replace("/tickets");
    }
  }, [error, router]);

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

  return (
    <div className="flex flex-col gap-6">
      {me.role === "agent" && (
        <Link href="/users" className="inline-flex w-fit items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground">
          <ArrowRightIcon size={16} />
          {t.users.back}
        </Link>
      )}

      <section className="flex flex-wrap items-center gap-4">
        <Avatar size="lg" color="accent" variant="soft">
          <Avatar.Fallback>{initials(user.name)}</Avatar.Fallback>
        </Avatar>
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight">{user.name}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
            <span dir="ltr">{user.email}</span>
            <DepartmentChip department={user.department} />
            <span>{t.role[user.role]}</span>
            <span>
              {t.users.joined}: {formatDate(user.createdAt)}
            </span>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-5">
        {[
          { label: t.users.statTotal, value: stats.total, strong: true },
          ...STATUSES.map((s) => ({ label: t.status[s], value: stats[s], strong: false })),
        ].map((item) => (
          <div key={item.label} className="bg-surface px-4 py-4">
            <p className={`text-2xl font-bold tabular-nums leading-none ${item.strong ? "text-accent" : ""}`}>
              {item.value.toLocaleString("fa-IR")}
            </p>
            <p className="mt-2 text-xs text-muted">{item.label}</p>
          </div>
        ))}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-bold">{t.users.ticketsOfUser}</h2>
        <TicketList
          tickets={tickets}
          highlightAttention={me.role === "agent"}
          empty={<EmptyBox icon={<TicketIcon size={24} />} title={t.tickets.empty} />}
        />
      </section>
    </div>
  );
}