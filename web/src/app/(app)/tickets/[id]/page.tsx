"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Skeleton, toast } from "@heroui/react";
import { ArrowRightIcon } from "@phosphor-icons/react";
import { Thread } from "@/components/Thread";
import { TicketInfo } from "@/components/TicketInfo";
import { ApiError } from "@/lib/api-client";
import { useMe } from "@/lib/hooks/use-me";
import { useTicket } from "@/lib/hooks/use-tickets";
import { t } from "@/lib/strings.fa";

export default function TicketPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: me } = useMe();
  const { data: ticket, error } = useTicket(id);

  useEffect(() => {
    if (error instanceof ApiError && error.status === 404) {
      toast.danger(t.errors.notAuthorized);
      router.replace("/tickets");
    }
  }, [error, router]);

  if (!ticket || !me) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-4 w-32 rounded-lg" />
        <Skeleton className="h-9 w-2/3 rounded-xl" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <Link href="/tickets" className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground">
          <ArrowRightIcon size={16} />
          {t.tickets.back}
        </Link>
        <h1 dir="auto" className="mt-3 text-2xl font-bold leading-snug tracking-tight">
          {ticket.title}
        </h1>
      </div>

      {/* The facts panel comes first on small screens so an agent sees the status controls without scrolling. */}
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-start">
        <div className="order-2 lg:order-1">
          <Thread ticket={ticket} me={me} />
        </div>
        <div className="order-1 lg:order-2">
          <TicketInfo ticket={ticket} me={me} />
        </div>
      </div>
    </div>
  );
}