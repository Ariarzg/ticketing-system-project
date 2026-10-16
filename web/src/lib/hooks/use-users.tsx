"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { api } from "../api-client";
import type { Department, Role, Status } from "../constants";
import type { TicketDto } from "./use-tickets";

export type UserRow = {
  id: string;
  slug: string;
  name: string;
  email: string;
  department: Department;
  createdAt: string;
  openTickets: number;
};

export type UserProfile = {
  user: {
    id: string;
    slug: string;
    name: string;
    email: string;
    role: Role;
    department: Department;
    createdAt: string;
  };
  stats: Record<Status, number> & { total: number };
  tickets: TicketDto[];
};

export function useUsers(q: string, enabled: boolean) {
  return useQuery({
    queryKey: ["users", q],
    queryFn: () => api<{ items: UserRow[] }>(`/api/users${q ? `?q=${encodeURIComponent(q)}` : ""}`).then((r) => r.items),
    enabled,
    placeholderData: keepPreviousData,
  });
}

export function useUserProfile(slug: string) {
  return useQuery({
    queryKey: ["user", slug],
    queryFn: () => api<UserProfile>(`/api/users/${slug}`),
  });
}