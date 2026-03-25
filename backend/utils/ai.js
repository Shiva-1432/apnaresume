function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableAiError(error) {
  const message = String(error?.message || '').toLowerCase();
  const status = Number(error?.status || error?.statusCode || error?.response?.status || 0);

  if ([429, 500, 502, 503, 504].includes(status)) {
    return true;
  }

  return (
    message.includes('rate limit')
    || message.includes('resource exhausted')
    || message.includes('temporar')
    || message.includes('timeout')
    || message.includes('unavailable')
    || message.includes('overloaded')
  );
}

async function generateContentWithRetry(model, prompt, options = {}) {
  const maxAttempts = Number(options.maxAttempts || 3);
  const baseDelayMs = Number(options.baseDelayMs || 700);

  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await model.generateContent(prompt);
    } catch (error) {
      lastError = error;
      if (attempt >= maxAttempts || !isRetryableAiError(error)) {
        throw error;
      }

      const jitter = Math.floor(Math.random() * 150);
      const delay = (baseDelayMs * (2 ** (attempt - 1))) + jitter;
      await sleep(delay);
    }
  }

  throw lastError;
}

module.exports = {
  generateContentWithRetry,
  isRetryableAiError
};
