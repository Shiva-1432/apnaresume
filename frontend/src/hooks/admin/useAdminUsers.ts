"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuthenticatedApi } from "@/hooks/useAuthenticatedApi";
import { ADMIN_ENDPOINTS } from "@/lib/api/endpoints";
import { admin } from "@/lib/api/queryKeys";
import type { AdminUser, AdminUsersFilters } from "@/types/admin";
import { toQueryString } from "./utils";

type AdminUsersResponse = {
  success?: boolean;
  users?: AdminUser[];
};

export function useAdminUsers(filters?: AdminUsersFilters) {
  const { request, isLoaded } = useAuthenticatedApi();

  return useQuery<AdminUser[]>({
    queryKey: filters
      ? admin.usersFiltered(filters as Record<string, unknown>)
      : admin.users(),
    enabled: isLoaded,
    queryFn: async () => {
      const response = await request<AdminUsersResponse>({
        method: "GET",
        url: `${ADMIN_ENDPOINTS.users}${toQueryString(filters as Record<string, unknown> | undefined)}`,
      });

      return response.users ?? [];
    },
  });
}
