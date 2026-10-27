'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '../api-client';
import type { Role } from '../constants';

export type MeUser = {
	id: string;
	slug: string;
	name: string;
	email: string;
	role: Role;
	organizationId: string;
};

export function useMe() {
	return useQuery({
		queryKey: ['me'],
		queryFn: () => api<{ user: MeUser }>('/api/auth/me').then((r) => r.user),
		staleTime: 5 * 60_000,
	});
}
