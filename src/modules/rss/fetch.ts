import type { FetchFn } from "../../core/guards.ts";
import { FeedError } from "./parse.ts";

export const MAX_FEED_BYTES = 2_000_000;
const TIMEOUT_MS = 20_000;

/** A feed's body as text; any failure (network, status, over 2 MB) is a FeedError with a short reason. */
export async function fetchFeed(url: string, fetchFn: FetchFn = fetch): Promise<string> {
  let res: Response;
  try {
    res = await fetchFn(url, {
      headers: {
        "user-agent": "Gork RSS (Discord bot)",
        accept: "application/rss+xml, application/atom+xml, application/xml, text/xml, */*",
      },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (err) {
    throw new FeedError(err instanceof Error ? err.message : String(err));
  }
  if (!res.ok) throw new FeedError(`HTTP ${res.status}`);
  if (!res.body) return "";
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_FEED_BYTES) throw new FeedError("feed is larger than 2 MB");
      chunks.push(value);
    }
  } catch (err) {
    if (err instanceof FeedError) throw err;
    throw new FeedError(err instanceof Error ? err.message : String(err));
  } finally {
    await reader.cancel().catch(() => undefined);
  }
  return new TextDecoder().decode(Buffer.concat(chunks));
}
