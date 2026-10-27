'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@heroui/react';
import { api } from '../api-client';
import { errorMessage } from '../errors';
import { t } from '../strings.fa';

export function usePromote(slug: string) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: () => api(`/api/users/${slug}/promote`, { method: 'POST' }),
		onSuccess: async () => {
			toast.success(t.users.promoted);
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: ['user', slug] }),
				queryClient.invalidateQueries({ queryKey: ['users'] }),
				queryClient.invalidateQueries({ queryKey: ['agents'] }),
			]);
		},
		onError: (err) => toast.danger(errorMessage(err)),
	});
}
