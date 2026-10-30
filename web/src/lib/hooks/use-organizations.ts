// file: src/lib/hooks/use-organizations.ts
'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@heroui/react';
import { api } from '../api-client';
import type { Role } from '../constants';
import { errorMessage } from '../errors';
import { t } from '../strings.fa';
import type { TicketDto } from './use-tickets';

export type OrganizationDto = {
	id: string;
	name: string;
	isDefault: boolean;
	createdAt: string;
};

export type OrganizationMember = {
	id: string;
	slug: string;
	name: string;
	email: string;
	role: Role;
	createdAt: string;
};

/** Supervisor only: one organization with its active tickets and everyone in it (D29). */
export function useOrganization(id: string, enabled: boolean) {
	return useQuery({
		queryKey: ['organization', id],
		queryFn: () =>
			api<{
				organization: OrganizationDto;
				tickets: TicketDto[];
				users: OrganizationMember[];
			}>(`/api/organizations/${id}`),
		enabled,
	});
}

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
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: ['organizations'] }),
				queryClient.invalidateQueries({ queryKey: ['organization', id] }),
			]);
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
