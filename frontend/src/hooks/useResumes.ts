"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthenticatedApi } from "@/hooks/useAuthenticatedApi";
import {
  toggleStarInCache,
  type ResumeCacheItem,
} from "@/hooks/resumeCache";
import { resumes as resumeKeys } from "@/lib/api/queryKeys";

export const resumeQueryKeys = {
  myResumes: () => resumeKeys.list(),
};

type UserResumesResponse = {
  success?: boolean;
  resumes?: ResumeCacheItem[];
};

export function useResumes() {
  const { request, isLoaded } = useAuthenticatedApi();

  return useQuery<ResumeCacheItem[]>({
    queryKey: resumeKeys.list(),
    enabled: isLoaded,
    queryFn: async () => {
      const response = await request<UserResumesResponse>({
        method: "GET",
        url: "/analysis/user-resumes",
      });

      return response.resumes ?? [];
    },
  });
}

export type StarToggleTarget = {
  id: string;
  starred: boolean;
};

type ToggleStarVariables = {
  resumeId: string;
  currentStarred: boolean;
};

type ToggleStarContext<TResume extends StarToggleTarget> = {
  previousResumes: TResume[];
};

type ToggleStarOptions<TResume extends StarToggleTarget> = {
  onOptimisticUpdate?: (nextResumes: TResume[]) => void;
  onRollback?: (previousResumes: TResume[]) => void;
};

export function useToggleStar<TResume extends StarToggleTarget = StarToggleTarget>(
  options: ToggleStarOptions<TResume> = {}
) {
  const { request } = useAuthenticatedApi();
  const queryClient = useQueryClient();

  return useMutation<void, Error, ToggleStarVariables, ToggleStarContext<TResume>>({
    mutationFn: async ({ resumeId, currentStarred }) => {
      await request({
        method: "PATCH",
        url: `/analysis/resume/${resumeId}`,
        data: { starred: !currentStarred },
      });
    },
    onMutate: async ({ resumeId, currentStarred }) => {
      await queryClient.cancelQueries({ queryKey: resumeKeys.list() });

      const previousResumes =
        (queryClient.getQueryData<TResume[]>(resumeKeys.list()) ?? []) as TResume[];

      const nextResumes = toggleStarInCache(previousResumes, resumeId, currentStarred) as TResume[];

      queryClient.setQueryData(resumeKeys.list(), nextResumes);
      options.onOptimisticUpdate?.(nextResumes);

      return { previousResumes };
    },
    onError: (error, _variables, context) => {
      if (context?.previousResumes) {
        queryClient.setQueryData(resumeKeys.list(), context.previousResumes);
        options.onRollback?.(context.previousResumes);
      }
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: resumeKeys.list() });
      if (variables?.resumeId) {
        queryClient.invalidateQueries({ queryKey: resumeKeys.detail(variables.resumeId) });
      }
    },
  });
}