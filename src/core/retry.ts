export async function retry<T>(
  fn: () => Promise<T>,
  opts: { attempts: number; delayMs: number; retryable?: (err: unknown) => boolean },
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= opts.attempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;

      if (opts.retryable && !opts.retryable(err)) throw err;

      if (attempt < opts.attempts) await Bun.sleep(opts.delayMs * attempt);
    }
  }

  throw lastError;
}
