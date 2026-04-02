"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuthenticatedApi } from "@/hooks/useAuthenticatedApi";
import type { ResumeCacheItem } from "@/hooks/resumeCache";
import { resumes } from "@/lib/api/queryKeys";

type TrashResponse = {
  success?: boolean;
  resumes?: ResumeCacheItem[];
};

export function useTrash() {
  const { request, isLoaded } = useAuthenticatedApi();

  return useQuery<ResumeCacheItem[]>({
    queryKey: resumes.trash(),
    enabled: isLoaded,
    queryFn: async () => {
      const response = await request<TrashResponse>({
        method: "GET",
        url: "/analysis/trash",
      });

      return response.resumes ?? [];
    },
  });
}