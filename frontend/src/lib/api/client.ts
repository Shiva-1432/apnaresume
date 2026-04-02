import axios, { AxiosError, AxiosHeaders, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL } from '@/lib/apiBaseUrl';

export class ApiError extends Error {
  readonly code: string;
  readonly status?: number;
  readonly details?: unknown;

  constructor(message: string, code: string, status?: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = 'Forbidden', code = 'FORBIDDEN', details?: unknown) {
    super(message, code, 403, details);
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends ApiError {
  constructor(message = 'Not Found', code = 'NOT_FOUND', details?: unknown) {
    super(message, code, 404, details);
    this.name = 'NotFoundError';
  }
}

type ErrorEnvelope = {
  message: string;
  code: string;
};

type TokenProvider = () => Promise<string | null>;

let tokenProvider: TokenProvider | null = null;

export function setTokenProvider(provider: TokenProvider | null) {
  tokenProvider = provider;
}

function normalizeErrorEnvelope(payload: unknown, fallbackCode: string): ErrorEnvelope {
  if (payload && typeof payload === 'object') {
    const data = payload as Record<string, unknown>;

    if (typeof data.message === 'string' && typeof data.code === 'string') {
      return { message: data.message, code: data.code };
    }

    const nestedError = data.error;
    if (nestedError && typeof nestedError === 'object') {
      const errorObj = nestedError as Record<string, unknown>;
      if (typeof errorObj.message === 'string' && typeof errorObj.code === 'string') {
        return { message: errorObj.message, code: errorObj.code };
      }
      if (typeof errorObj.message === 'string') {
        return { message: errorObj.message, code: fallbackCode };
      }
      if (typeof errorObj.code === 'string') {
        return { message: 'Request failed', code: errorObj.code };
      }
    }

    if (typeof data.message === 'string') {
      return { message: data.message, code: fallbackCode };
    }

    if (typeof data.error === 'string') {
      return { message: data.error, code: fallbackCode };
    }
  }

  return { message: 'Request failed', code: fallbackCode };
}

function handleUnauthorized() {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.clear();
    window.sessionStorage.clear();
  } catch {
    // Ignore storage clear failures and continue redirect.
  }

  window.location.assign('/sign-in');
}

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

apiClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  // Always fetch a fresh Clerk token per outgoing request.
  const token = tokenProvider ? await tokenProvider() : null;

  if (!token) {
    return config;
  }

  const headers = config.headers instanceof AxiosHeaders
    ? config.headers
    : new AxiosHeaders(config.headers as Record<string, string> | undefined);

  headers.set('Authorization', `Bearer ${token}`);
  config.headers = headers;

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const status = error.response?.status;
    const fallbackCode = status ? `HTTP_${status}` : 'NETWORK_ERROR';
    const envelope = normalizeErrorEnvelope(error.response?.data, fallbackCode);

    if (status === 401) {
      handleUnauthorized();
      return Promise.reject(new ApiError(envelope.message || 'Unauthorized', envelope.code || 'UNAUTHORIZED', 401, error.response?.data));
    }

    if (status === 403) {
      return Promise.reject(new ForbiddenError(envelope.message, envelope.code, error.response?.data));
    }

    if (status === 404) {
      return Promise.reject(new NotFoundError(envelope.message, envelope.code, error.response?.data));
    }

    return Promise.reject(new ApiError(envelope.message, envelope.code, status, error.response?.data));
  }
);

export default apiClient;
