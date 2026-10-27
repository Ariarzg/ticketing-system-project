// file: src/lib/hooks/use-organizations.ts
'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@heroui/react';
import { api } from '../api-client';
import { errorMessage } from '../errors';
import { t } from '../strings.fa';

export type OrganizationDto = {
	id: string;
	name: string;
	isDefault: boolean;
	createdAt: string;
};

export function useOrganizations() {
	return useQuery({
		queryKey: ['organizations'],
		queryFn: () =>
			api<{ items: OrganizationDto[] }>('/api/organizations').then(
				(r) => r.items,
			),
		staleTime: 5 * 60_000,
	});
}

/** An organization's name by id, from the cached list. Undefined while the list loads. */
export function useOrganizationName(id: string) {
	const { data } = useOrganizations();
	return data?.find((o) => o.id === id)?.name;
}

/** Adds an organization, or renames the one with this id. */
export function useSaveOrganization(id?: string) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (name: string) =>
			id ?
				api(`/api/organizations/${id}`, { method: 'PATCH', json: { name } })
			:	api('/api/organizations', { method: 'POST', json: { name } }),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ['organizations'] });
			toast.success(id ? t.organizations.saved : t.organizations.created);
		},
		onError: (err) => toast.danger(errorMessage(err)),
	});
}

export function useDeleteOrganization() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: string) =>
			api(`/api/organizations/${id}`, { method: 'DELETE' }),
		// Users and tickets moved to the default organization, so every cached list is out of date.
		onSuccess: async () => {
			await queryClient.invalidateQueries();
			toast.success(t.organizations.deleted);
		},
		onError: (err) => toast.danger(errorMessage(err)),
	});
}
