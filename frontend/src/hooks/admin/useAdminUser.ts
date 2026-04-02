"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuthenticatedApi } from "@/hooks/useAuthenticatedApi";
import { ADMIN_ENDPOINTS } from "@/lib/api/endpoints";
import { admin } from "@/lib/api/queryKeys";
import type { AdminUser } from "@/types/admin";

type AdminUserResponse = {
  success?: boolean;
  user?: AdminUser;
};

export function useAdminUser(id: string) {
  const { request, isLoaded } = useAuthenticatedApi();
  const userId = String(id || "").trim();

  return useQuery<AdminUser | null>({
    queryKey: admin.user(userId),
    enabled: isLoaded && Boolean(userId),
    queryFn: async () => {
      const response = await request<AdminUserResponse>({
        method: "GET",
        url: ADMIN_ENDPOINTS.user(userId),
      });

      return response.user ?? null;
    },
  });
}
