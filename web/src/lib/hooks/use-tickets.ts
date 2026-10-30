'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { api } from '../api-client';
import type { Priority, Status } from '../constants';
import type { AttachmentDto } from '../files';

export type TicketDto = {
	id: string;
	title: string;
	description: string;
	/** Null until the supervisor sets it, and always null for clients (D26). */
	priority: Priority | null;
	status: Status;
	organizationId: string;
	/** The assigned agent; null until assigned, and always null for clients. */
	assigneeId: string | null;
	createdAt: string;
	updatedAt: string;
	authorId: string;
	authorName: string;
	authorSlug: string;
};

/** One ticket as its own page gets it: with the files attached to the description (D28). */
export type TicketDetailDto = TicketDto & { attachments: AttachmentDto[] };

export type TicketsResponse = {
	items: TicketDto[];
	total?: number;
	page?: number;
	pageSize?: number;
	statusCounts?: Record<Status, number>;
	attentionCount?: number;
	unassignedCount?: number;
	reviewCount?: number;
};

/** `search` is the raw query string, e.g. "status=open&page=2". */
export function useTickets(search = '') {
	return useQuery({
		queryKey: ['tickets', search],
		queryFn: () =>
			api<TicketsResponse>(`/api/tickets${search ? `?${search}` : ''}`),
		placeholderData: keepPreviousData,
		refetchInterval: 10_000, // keeps the list fresh (an agent sees new tickets arrive)
	});
}

export function useTicket(id: string) {
	return useQuery({
		queryKey: ['ticket', id],
		queryFn: () =>
			api<{ ticket: TicketDetailDto }>(`/api/tickets/${id}`).then(
				(r) => r.ticket,
			),
		refetchInterval: 4_000, // polling: status changes from the other side show up (D9)
	});
}
