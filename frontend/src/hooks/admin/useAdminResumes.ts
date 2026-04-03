"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuthenticatedApi } from "@/hooks/useAuthenticatedApi";
import { ADMIN_ENDPOINTS } from "@/lib/api/endpoints";
import { admin } from "@/lib/api/queryKeys";
import type { AdminResume } from "@/types/admin";
import { toQueryString } from "./utils";

export type AdminResumesFilters = {
  page?: number;
  limit?: number;
  status?: string;
  scoreTier?: string;
  search?: string;
};

type AdminResumesResponse = {
  success?: boolean;
  resumes?: AdminResume[];
  data?: AdminResume[];
  pagination?: {
    page?: number;
    totalPages?: number;
    totalItems?: number;
    total?: number;
  };
};

export function useAdminResumes(filters?: AdminResumesFilters) {
  const { request, isLoaded } = useAuthenticatedApi();

  return useQuery<{ resumes: AdminResume[]; pagination?: AdminResumesResponse["pagination"] }>({
    queryKey: [
      ...admin.resumes(),
      filters?.page ?? 1,
      filters?.limit ?? 20,
      filters?.status ?? "all",
      filters?.scoreTier ?? "all",
      filters?.search ?? "",
    ],
    enabled: isLoaded,
    queryFn: async () => {
      const response = await request<AdminResumesResponse>({
        method: "GET",
        url: `${ADMIN_ENDPOINTS.resumes}${toQueryString({
          page: filters?.page,
          limit: filters?.limit,
          status: filters?.status,
          scoreTier: filters?.scoreTier,
          search: filters?.search,
        })}`,
      });

      return {
        resumes: response.resumes ?? response.data ?? [],
        pagination: response.pagination,
      };
    },
  });
}
