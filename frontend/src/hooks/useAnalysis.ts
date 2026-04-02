"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuthenticatedApi } from "@/hooks/useAuthenticatedApi";
import { resumes } from "@/lib/api/queryKeys";

export type AnalysisQueryResult = {
  success: boolean;
  resume: Record<string, unknown>;
  analysis: Record<string, unknown> | null;
};

export function useAnalysis(id: string) {
  const { request, isLoaded } = useAuthenticatedApi();
  const resumeId = String(id || "").trim();

  return useQuery<AnalysisQueryResult>({
    queryKey: resumes.analysis(resumeId),
    enabled: isLoaded && Boolean(resumeId),
    staleTime: 0,
    refetchInterval: (query) => (query.state.data?.analysis ? false : 5000),
    queryFn: () =>
      request<AnalysisQueryResult>({
        method: "GET",
        url: `/analysis/resume/${resumeId}`,
      }),
  });
}