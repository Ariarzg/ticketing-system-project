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
import { formatDay } from "@/lib/dates";
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
    if (error instanceof ApiError && error.status === 404 && me) {
      // Agents may see every profile, so for them a 404 really means "no such user" (D11 is about hiding from clients).
      toast.danger(me.role === "agent" ? t.users.notFound : t.errors.notAuthorized);
      router.replace(me.role === "agent" ? "/users" : "/tickets");
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
  // Agents do not file tickets, so their profile has no stats or list to show.
  const isClientProfile = user.role === "client";

  return (
    <div className="flex flex-col gap-6">
      {/* Only client profiles come from the users list; agents are not in it. */}
      {me.role === "agent" && isClientProfile && (
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
          <h1 dir="auto" className="text-right text-2xl font-bold tracking-tight break-words">
            {user.name}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
            {/* break-all: an email has no spaces, so on a phone it would be cut off instead of wrapping. */}
            <span dir="ltr" className="break-all">
              {user.email}
            </span>
            <DepartmentChip department={user.department} />
            <span>{t.role[user.role]}</span>
            <span>
              {t.users.joined}: {formatDay(user.createdAt)}
            </span>
          </div>
        </div>
      </section>

      {isClientProfile ? (
        <>
          <section className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-5">
            {[
              { label: t.users.statTotal, value: stats.total, strong: true },
              ...STATUSES.map((s) => ({ label: t.status[s], value: stats[s], strong: false })),
            ].map((item) => (
              <div key={item.label} className="bg-surface px-4 py-4">
                <p
                  className={`text-2xl font-bold tabular-nums leading-none ${item.strong ? "text-accent-soft-foreground" : ""}`}
                >
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
        </>
      ) : (
        <p className="max-w-[65ch] rounded-2xl border border-border bg-surface p-4 text-sm leading-relaxed text-muted">
          {t.users.agentProfileHint}
        </p>
      )}
    </div>
  );
}
