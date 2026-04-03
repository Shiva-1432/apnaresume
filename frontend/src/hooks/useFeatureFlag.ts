"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";

type PublicFlag = {
  name: string;
  enabled?: boolean;
  isEnabled?: boolean;
};

type PublicFlagsResponse = {
  success?: boolean;
  flags?: PublicFlag[];
  data?: PublicFlag[];
};

const EMPTY_FLAGS: PublicFlag[] = [];

function normalizeFlags(response: PublicFlagsResponse | PublicFlag[] | Record<string, unknown> | null | undefined): PublicFlag[] {
  if (!response) return EMPTY_FLAGS;

  if (Array.isArray(response)) {
    return response as PublicFlag[];
  }

  if (typeof response === "object") {
    const payload = response as PublicFlagsResponse & Record<string, unknown>;

    if (Array.isArray(payload.flags)) {
      return payload.flags as PublicFlag[];
    }

    if (Array.isArray(payload.data)) {
      return payload.data as PublicFlag[];
    }

    // Support map payloads like { job_matcher_enabled: true }
    const entries = Object.entries(payload).filter(([, value]) => typeof value === "boolean");
    if (entries.length > 0) {
      return entries.map(([name, enabled]) => ({ name, enabled: Boolean(enabled) }));
    }
  }

  return EMPTY_FLAGS;
}

export function useFeatureFlag(name: string): boolean {
  const flagName = String(name || "").trim();

  const query = useQuery<PublicFlag[]>({
    queryKey: ["feature-flags", "public"],
    staleTime: 60_000,
    queryFn: async () => {
      const response = await apiClient.get<PublicFlagsResponse | PublicFlag[] | Record<string, unknown>>("/api/flags");
      return normalizeFlags(response.data);
    },
  });

  return useMemo(() => {
    if (!flagName || !query.data?.length) return false;

    const found = query.data.find((flag) => flag.name === flagName);
    if (!found) return false;

    if (typeof found.enabled === "boolean") return found.enabled;
    if (typeof found.isEnabled === "boolean") return found.isEnabled;
    return false;
  }, [flagName, query.data]);
}

export default useFeatureFlag;
