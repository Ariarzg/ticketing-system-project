"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { api } from "../api-client";
import type { Department, Priority, Status } from "../constants";

export type TicketDto = {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  status: Status;
  department: Department;
  createdAt: string;
  updatedAt: string;
  authorId: string;
  authorName: string;
  authorSlug: string;
};

export type TicketsResponse = {
  items: TicketDto[];
  total?: number;
  page?: number;
  pageSize?: number;
  statusCounts?: Record<Status, number>;
  attentionCount?: number;
};

/** `search` is the raw query string, e.g. "status=open&page=2". */
export function useTickets(search = "") {
  return useQuery({
    queryKey: ["tickets", search],
    queryFn: () => api<TicketsResponse>(`/api/tickets${search ? `?${search}` : ""}`),
    placeholderData: keepPreviousData,
    refetchInterval: 10_000, // keeps the list fresh (an agent sees new tickets arrive)
  });
}

export function useTicket(id: string) {
  return useQuery({
    queryKey: ["ticket", id],
    queryFn: () => api<{ ticket: TicketDto }>(`/api/tickets/${id}`).then((r) => r.ticket),
    refetchInterval: 4_000, // polling: status changes from the other side show up (D9)
  });
}