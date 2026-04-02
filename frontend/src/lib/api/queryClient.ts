import { QueryCache, MutationCache, QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/client";

function shouldRetryQuery(failureCount: number, error: unknown) {
  if (!(error instanceof ApiError)) {
    return false;
  }

  if (error.status === 404) {
    return false;
  }

  if (error.code === "NETWORK_ERROR" || error.status == null) {
    return failureCount < 2;
  }

  return false;
}

function showApiErrorToast(error: unknown) {
  if (error instanceof ApiError) {
    toast.error(error.message);
  }
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      showApiErrorToast(error);
    },
  }),
  mutationCache: new MutationCache({
    onError: (error) => {
      showApiErrorToast(error);
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: shouldRetryQuery,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});