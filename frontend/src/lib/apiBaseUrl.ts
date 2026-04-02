import { env } from "@/lib/env";

const DEFAULT_API_BASE_URL = 'http://localhost:5000/api';

/**
 * Public API base URL (includes `/api`).
 */
export function getApiBaseUrl(): string {
  return env.NEXT_PUBLIC_API_BASE_URL || DEFAULT_API_BASE_URL;
}

/** Resolved at module load; equivalent to getApiBaseUrl() for typical usage. */
export const API_BASE_URL = getApiBaseUrl();
