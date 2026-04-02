"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthenticatedApi } from "@/hooks/useAuthenticatedApi";
import {
  getResumeCacheId,
  markDeletedInCache,
  removeResumeFromCache,
  type ResumeCacheItem,
} from "@/hooks/resumeCache";
import { resumes } from "@/lib/api/queryKeys";

type DeleteResumeVariables = {
  resumeId: string;
};

type DeleteResumeContext = {
  previousList: ResumeCacheItem[];
  previousTrash: ResumeCacheItem[];
};

export function useDeleteResume() {
  const { request } = useAuthenticatedApi();
  const queryClient = useQueryClient();

  return useMutation<void, Error, DeleteResumeVariables, DeleteResumeContext>({
    mutationFn: async ({ resumeId }) => {
      await request({
        method: "DELETE",
        url: `/analysis/resume/${resumeId}`,
      });
    },
    onMutate: async ({ resumeId }) => {
      await queryClient.cancelQueries({ queryKey: resumes.list() });
      await queryClient.cancelQueries({ queryKey: resumes.trash() });

      const previousList = queryClient.getQueryData<ResumeCacheItem[]>(resumes.list()) ?? [];
      const previousTrash = queryClient.getQueryData<ResumeCacheItem[]>(resumes.trash()) ?? [];

      const target = previousList.find((item) => getResumeCacheId(item) === resumeId);
      if (!target) {
        return { previousList, previousTrash };
      }

      queryClient.setQueryData(
        resumes.list(),
        removeResumeFromCache(previousList, resumeId)
      );
      queryClient.setQueryData(
        resumes.trash(),
        [markDeletedInCache(target), ...previousTrash]
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