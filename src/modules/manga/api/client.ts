import { retry } from "../../../core/retry.ts";
import type { ClientOptions, MangaDexGet, Query } from "./types.ts";

const API = "https://api.mangadex.org";
const GAP_MS = 250;
const TIMEOUT_MS = 20_000;
const HEADERS = { "user-agent": "Gork (Discord bot)", accept: "application/json" };

export class MangaDexError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

/** Network errors, rate limits and server errors may pass; another 4xx won't. */
const retryable = (err: unknown): boolean =>
  !(err instanceof MangaDexError) || err.status === 429 || err.status >= 500;

function url(path: string, query: Query): string {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    for (const v of Array.isArray(value) ? value : [value]) params.append(key, v);
  }

  const qs = params.toString();

  return `${API}${path}${qs ? `?${qs}` : ""}`;
}

/**
 * One MangaDex client per process: calls are spaced GAP_MS apart (MangaDex allows ~5/s) and
 * retryable failures are tried 3 times; a non-2xx answer is a MangaDexError.
 */
export function createClient(o: ClientOptions): MangaDexGet {
  // The per-client throttle: when the last request started.
  let last = Number.NEGATIVE_INFINITY;

  const once = async (target: string): Promise<unknown> => {
    const wait = last + GAP_MS - o.now();

    if (wait > 0) await o.sleep(wait);

    last = o.now();
    const res = await o.fetchFn(target, {
      headers: HEADERS,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!res.ok) throw new MangaDexError(`HTTP ${res.status}`, res.status);

    return res.json();
  };

  return (path, query) =>
    retry(() => once(url(path, query)), {
      attempts: 3,
      delayMs: o.retryDelayMs ?? 2000,
      retryable,
    });
}
