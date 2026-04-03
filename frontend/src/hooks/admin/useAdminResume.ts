"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuthenticatedApi } from "@/hooks/useAuthenticatedApi";
import { ADMIN_ENDPOINTS } from "@/lib/api/endpoints";
import { admin } from "@/lib/api/queryKeys";
import type { AdminResume } from "@/types/admin";

type AdminResumeResponse = {
  success?: boolean;
  resume?: AdminResume;
  data?: AdminResume;
};

export function useAdminResume(resumeId: string) {
  const { request, isLoaded } = useAuthenticatedApi();
  const id = String(resumeId || "").trim();

  return useQuery<AdminResume | null>({
    queryKey: [...admin.resumes(), "detail", id],
    enabled: isLoaded && Boolean(id),
    queryFn: async () => {
      const response = await request<AdminResumeResponse>({
        method: "GET",
        url: ADMIN_ENDPOINTS.resume(id),
      });

      return response.resume ?? response.data ?? null;
    },
  });
}
