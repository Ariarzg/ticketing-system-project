"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@heroui/react";
import { api } from "../api-client";
import type { Role } from "../constants";
import { errorMessage } from "../errors";

export type MessageDto = {
  id: string;
  body: string;
  createdAt: string;
  authorId: string;
  authorName: string;
  authorRole: Role;
};

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