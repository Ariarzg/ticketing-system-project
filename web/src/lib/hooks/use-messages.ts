"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@heroui/react";
import { api } from "../api-client";
import type { ReviewStatus, Role } from "../constants";
import { errorMessage } from "../errors";
import { t } from "../strings.fa";

/** What the supervisor did with an agent's reply. Clients always get null (D27). */
export type MessageReview = {
  status: ReviewStatus;
  editedBody: string | null;
  note: string | null;
  reviewedAt: string | null;
};

export type MessageDto = {
  id: string;
  body: string;
  createdAt: string;
  authorId: string;
  authorName: string;
  authorRole: Role;
  review: MessageReview | null;
};

export type ReviewInput = { messageId: string } & (
  | { action: "confirm" }
  | { action: "change"; body: string }
  | { action: "deny"; note: string }
);

export function useMessages(ticketId: string) {
  return useQuery({
    queryKey: ["messages", ticketId],
    queryFn: () => api<{ items: MessageDto[] }>(`/api/tickets/${ticketId}/messages`).then((r) => r.items),
    refetchInterval: 4_000,
  });
}

export function useSendMessage(ticketId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: string) =>
      api<{ message: MessageDto }>(`/api/tickets/${ticketId}/messages`, { method: "POST", json: { body } }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["messages", ticketId] }),
        queryClient.invalidateQueries({ queryKey: ["ticket", ticketId] }),
        queryClient.invalidateQueries({ queryKey: ["tickets"] }),
      ]);
    },
    onError: (err) => toast.danger(errorMessage(err)),
  });
}

/** Supervisor only: confirm, change or deny one reply. */
export function useReviewMessage(ticketId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ messageId, ...input }: ReviewInput) =>
      api(`/api/tickets/${ticketId}/messages/${messageId}/review`, { method: "POST", json: input }),
    onSuccess: async () => {
      toast.success(t.review.done);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["messages", ticketId] }),
        queryClient.invalidateQueries({ queryKey: ["ticket", ticketId] }),
        queryClient.invalidateQueries({ queryKey: ["tickets"] }),
      ]);
    },
    onError: (err) => toast.danger(errorMessage(err)),
  });
}
