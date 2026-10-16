"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button, Pagination, buttonVariants } from "@heroui/react";
import { MagnifyingGlassIcon, PlusIcon, TicketIcon } from "@phosphor-icons/react";
import { EmptyBox } from "@/components/EmptyBox";
import { PageHeader } from "@/components/PageHeader";
import { TicketFilters } from "@/components/TicketFilters";
import { TicketList, TicketListSkeleton } from "@/components/TicketList";
import { useMe } from "@/lib/hooks/use-me";
import { useTickets } from "@/lib/hooks/use-tickets";
import { t } from "@/lib/strings.fa";

export default function TicketsPage() {
  return (
    <Suspense fallback={<TicketListSkeleton />}>
      <TicketsView />
    </Suspense>
  );
}

function TicketsView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: me } = useMe();
  const { data, isLoading, isError, isPlaceholderData } = useTickets(searchParams.toString());
  const isAgent = me?.role === "agent";
  const isFiltered = ["status", "priority", "department", "q", "attention"].some((k) => searchParams.has(k));

  /** Updates several URL parameters in one navigation. A new filter always starts at page 1. */
  function setParams(updates: Record<string, string | null>) {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    if (!("page" in updates)) next.delete("page");
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }

  const page = data?.page ?? 1;
  const totalPages = data?.total && data.pageSize ? Math.ceil(data.total / data.pageSize) : 1;
  const first = Math.max(1, page - 2);
  const last = Math.min(totalPages, page + 2);
  const pages = Array.from({ length: last - first + 1 }, (_, i) => first + i);

  // Links, not buttons: they navigate, so Ctrl/middle click opens them in a new tab.
  const newTicketButton =
    me?.role === "client" ? (
      <Link href="/tickets/new" className={buttonVariants({ variant: "primary" })}>
        <PlusIcon size={18} />
        {t.nav.newTicket}
      </Link>
    ) : undefined;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title={isAgent ? t.tickets.allTitle : t.tickets.myTitle}
        description={isAgent ? t.tickets.allHint : t.tickets.myHint}
        actions={newTicketButton}
      />

      {me && (
        <TicketFilters
          params={new URLSearchParams(searchParams.toString())}
          setParams={setParams}
          isAgent={isAgent}
          statusCounts={data?.statusCounts}
          attentionCount={data?.attentionCount}
        />
      )}

      {isLoading && <TicketListSkeleton />}
      {isError && <p className="text-danger">{t.errors.server}</p>}
      {data && (
        <div className={isPlaceholderData ? "opacity-60 transition-opacity" : undefined}>
          <TicketList
            tickets={data.items}
            showAuthor={isAgent}
            highlightAttention={isAgent}
            empty={
              isFiltered ? (
                <EmptyBox
                  icon={<MagnifyingGlassIcon size={24} />}
                  title={t.tickets.noResults}
                  hint={t.tickets.noResultsHint}
                  action={
                    <Button size="sm" variant="secondary" onPress={() => router.replace(pathname)}>
                      {t.filters.clear}
                    </Button>
                  }
                />
              ) : (
                <EmptyBox
                  icon={<TicketIcon size={24} />}
                  title={t.tickets.empty}
                  hint={me?.role === "client" ? t.tickets.emptyClientHint : t.tickets.emptyAgentHint}
                  action={
                    me?.role === "client" ? (
                      <Link href="/tickets/new" className={buttonVariants({ size: "sm", variant: "primary" })}>
                        {t.nav.newTicket}
                      </Link>
                    ) : undefined
                  }
                />
              )
            }
          />
        </div>
      )}

      {totalPages > 1 && (
        <Pagination className="justify-center">
          <Pagination.Content>
            <Pagination.Item>
              <Pagination.Previous isDisabled={page === 1} onPress={() => setParams({ page: String(page - 1) })}>
                <Pagination.PreviousIcon className="rtl:rotate-180" />
                <span>{t.filters.previous}</span>
              </Pagination.Previous>
            </Pagination.Item>
            {pages.map((p) => (
              <Pagination.Item key={p}>
                <Pagination.Link isActive={p === page} onPress={() => setParams({ page: String(p) })}>
                  {p.toLocaleString("fa-IR")}
                </Pagination.Link>
              </Pagination.Item>
            ))}
            <Pagination.Item>
              <Pagination.Next isDisabled={page === totalPages} onPress={() => setParams({ page: String(page + 1) })}>
                <span>{t.filters.next}</span>
                <Pagination.NextIcon className="rtl:rotate-180" />
              </Pagination.Next>
            </Pagination.Item>
          </Pagination.Content>
        </Pagination>
      )}
    </div>
  );
}