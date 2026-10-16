"use client";

import { useRouter } from "next/navigation";
import { Button } from "@heroui/react";
import { PlusIcon, TicketIcon } from "@phosphor-icons/react";
import { EmptyBox } from "@/components/EmptyBox";
import { PageHeader } from "@/components/PageHeader";
import { TicketList, TicketListSkeleton } from "@/components/TicketList";
import { useMe } from "@/lib/hooks/use-me";
import { useTickets } from "@/lib/hooks/use-tickets";
import { t } from "@/lib/strings.fa";

export default function TicketsPage() {
  const router = useRouter();
  const { data: me } = useMe();
  const { data, isLoading, isError } = useTickets();
  const isAgent = me?.role === "agent";
  const isClient = me?.role === "client";

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title={isAgent ? t.tickets.allTitle : t.tickets.myTitle}
        description={isAgent ? t.tickets.allHint : t.tickets.myHint}
        actions={
          isClient ? (
            <Button variant="primary" onPress={() => router.push("/tickets/new")}>
              <PlusIcon size={18} />
              {t.nav.newTicket}
            </Button>
          ) : undefined
        }
      />
      {isLoading && <TicketListSkeleton />}
      {isError && <p className="text-danger">{t.errors.server}</p>}
      {data && (
        <TicketList
          tickets={data.items}
          showAuthor={isAgent}
          highlightAttention={isAgent}
          empty={
            <EmptyBox
              icon={<TicketIcon size={24} />}
              title={t.tickets.empty}
              hint={isClient ? t.tickets.emptyClientHint : t.tickets.emptyAgentHint}
              action={
                isClient ? (
                  <Button size="sm" variant="primary" onPress={() => router.push("/tickets/new")}>
                    {t.nav.newTicket}
                  </Button>
                ) : undefined
              }
            />
          }
        />
      )}
    </div>
  );
}