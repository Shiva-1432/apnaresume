import axios, { AxiosError, AxiosResponse } from 'axios';

type RetryOptions = {
  maxAttempts?: number;
  baseDelayMs?: number;
};

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryable(error: unknown) {
  if (!axios.isAxiosError(error)) {
    return false;
  }

  const status = error.response?.status;
  if (!status) {
    return true;
  }

  return status === 429 || (status >= 500 && status <= 599);
}

export async function requestWithRetry<T>(
  requestFn: () => Promise<AxiosResponse<T>>,
  options: RetryOptions = {}
): Promise<AxiosResponse<T>> {
  const maxAttempts = options.maxAttempts ?? 3;
  const baseDelayMs = options.baseDelayMs ?? 300;

  let lastError: AxiosError | unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error;

      if (attempt >= maxAttempts || !isRetryable(error)) {
        throw error;
      }

      const jitter = Math.floor(Math.random() * 120);
      await wait((baseDelayMs * (2 ** (attempt - 1))) + jitter);
    }
  }

  throw lastError;
}
