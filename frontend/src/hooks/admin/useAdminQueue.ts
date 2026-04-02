"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuthenticatedApi } from "@/hooks/useAuthenticatedApi";
import { ADMIN_ENDPOINTS } from "@/lib/api/endpoints";
import { admin } from "@/lib/api/queryKeys";
import type { QueueJob } from "@/types/admin";

type AdminQueueResponse = {
  success?: boolean;
  queue?: QueueJob[];
  jobs?: QueueJob[];
};

export function useAdminQueue() {
  const { request, isLoaded } = useAuthenticatedApi();

  return useQuery<QueueJob[]>({
    queryKey: admin.queue(),
    enabled: isLoaded,
    queryFn: async () => {
      const response = await request<AdminQueueResponse>({
        method: "GET",
        url: ADMIN_ENDPOINTS.queue,
      });

      return response.queue ?? response.jobs ?? [];
    },
  });
}
