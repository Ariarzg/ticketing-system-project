"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@heroui/react";
import { api } from "../api-client";
import { errorMessage } from "../errors";

export function useSetStatus(ticketId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (status: "in_progress" | "answered" | "closed") =>
      api(`/api/tickets/${ticketId}/status`, { method: "PATCH", json: { status } }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["ticket", ticketId] }),
        queryClient.invalidateQueries({ queryKey: ["tickets"] }),
      ]);
    },
    onError: (err) => toast.danger(errorMessage(err)),
  });
}