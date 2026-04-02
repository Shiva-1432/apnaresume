"use client";

import { useAuth } from "@clerk/nextjs";
import type { AxiosRequestConfig } from "axios";
import { useCallback } from "react";
import { ApiError, apiClient } from "@/lib/api/client";

type RequestConfig = AxiosRequestConfig & {
  headers?: Record<string, string>;
};

export function useAuthenticatedApi() {
  const { getToken, isLoaded } = useAuth();

  const request = useCallback(
    async <T,>(config: RequestConfig): Promise<T> => {
      const token = await getToken();

      if (!token) {
        throw new ApiError("Authentication required", "UNAUTHORIZED", 401);
      }

      const response = await apiClient.request<T>({
        ...config,
        headers: {
          ...(config.headers || {}),
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data;
    },
    [getToken]
  );

  return { request, isLoaded };
}