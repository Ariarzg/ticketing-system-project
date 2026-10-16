"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PlusCircleIcon, TicketIcon, UserCircleIcon, UsersThreeIcon } from "@phosphor-icons/react";
import type { MeUser } from "@/lib/hooks/use-me";
import { t } from "@/lib/strings.fa";

export function NavLinks({ me, onNavigate }: { me: MeUser; onNavigate?: () => void }) {
  const pathname = usePathname();

  const items = [
    { href: "/tickets", label: t.nav.tickets, icon: TicketIcon, match: (p: string) => p === "/tickets" || /^\/tickets\/(?!new)/.test(p) },
    ...(me.role === "client"
      ? [{ href: "/tickets/new", label: t.nav.newTicket, icon: PlusCircleIcon, match: (p: string) => p === "/tickets/new" }]
      : []),
    ...(me.role === "agent"
      ? [{ href: "/users", label: t.nav.users, icon: UsersThreeIcon, match: (p: string) => p === "/users" }]
      : []),
    {
      href: `/users/${me.slug}`,
      label: t.nav.myProfile,
      icon: UserCircleIcon,
      match: (p: string) => p === `/users/${me.slug}`,
    },
  ];

  return (
    <nav aria-label={t.nav.label} className="flex flex-col gap-1">
      {items.map(({ href, label, icon: Icon, match }) => {
        const active = match(pathname);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
              active
                ? "bg-accent-soft text-accent-soft-foreground"
                : "text-muted hover:bg-surface-secondary hover:text-foreground"
            }`}
          >
            <Icon size={20} weight={active ? "fill" : "regular"} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}