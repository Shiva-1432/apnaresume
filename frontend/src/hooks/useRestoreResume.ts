"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthenticatedApi } from "@/hooks/useAuthenticatedApi";
import {
  getResumeCacheId,
  markRestoredInCache,
  removeResumeFromCache,
  upsertResumeToFront,
  type ResumeCacheItem,
} from "@/hooks/resumeCache";
import { resumes } from "@/lib/api/queryKeys";

type RestoreResumeVariables = {
  resumeId: string;
};

type RestoreResumeContext = {
  previousList: ResumeCacheItem[];
  previousTrash: ResumeCacheItem[];
};

export function useRestoreResume() {
  const { request } = useAuthenticatedApi();
  const queryClient = useQueryClient();

  return useMutation<void, Error, RestoreResumeVariables, RestoreResumeContext>({
    mutationFn: async ({ resumeId }) => {
      await request({
        method: "POST",
        url: `/analysis/resume/${resumeId}/restore`,
      });
    },
    onMutate: async ({ resumeId }) => {
      await queryClient.cancelQueries({ queryKey: resumes.list() });
      await queryClient.cancelQueries({ queryKey: resumes.trash() });

      const previousList = queryClient.getQueryData<ResumeCacheItem[]>(resumes.list()) ?? [];
      const previousTrash = queryClient.getQueryData<ResumeCacheItem[]>(resumes.trash()) ?? [];

      const target = previousTrash.find((item) => getResumeCacheId(item) === resumeId);
      if (!target) {
        return { previousList, previousTrash };
      }

      const restored = markRestoredInCache(target);
      queryClient.setQueryData(
        resumes.trash(),
        removeResumeFromCache(previousTrash, resumeId)
      );
      queryClient.setQueryData(
        resumes.list(),
        upsertResumeToFront(previousList, restored)
      );

      return { previousList, previousTrash };
    },
    onError: (_error, _variables, context) => {
      if (context) {
        queryClient.setQueryData(resumes.list(), context.previousList);
        queryClient.setQueryData(resumes.trash(), context.previousTrash);
      }
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: resumes.list() });
      queryClient.invalidateQueries({ queryKey: resumes.trash() });
      if (variables?.resumeId) {
        queryClient.invalidateQueries({ queryKey: resumes.detail(variables.resumeId) });
        queryClient.invalidateQueries({ queryKey: resumes.analysis(variables.resumeId) });
      }
    },
  });
}