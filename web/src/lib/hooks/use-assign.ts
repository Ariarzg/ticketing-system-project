'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@heroui/react';
import { api } from '../api-client';
import type { Priority } from '../constants';
import { errorMessage } from '../errors';
import { t } from '../strings.fa';

export function useAssignTicket(ticketId: string) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (input: { agentId: string; priority: Priority }) =>
			api(`/api/tickets/${ticketId}/assign`, { method: 'POST', json: input }),
		onSuccess: async () => {
			toast.success(t.assign.done);
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] }),
				queryClient.invalidateQueries({ queryKey: ['tickets'] }),
			]);
		},
		onError: (err) => toast.danger(errorMessage(err)),
	});
}
