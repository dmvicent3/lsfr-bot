import type { FetchFn } from "../../../core/types.ts";
import { checkHost, resolve } from "./host.ts";
import type { Lookup } from "./types.ts";
import { FeedError } from "./parse.ts";

export const MAX_FEED_BYTES = 2_000_000;
const TIMEOUT_MS = 20_000;
const MAX_REDIRECTS = 5;
const HEADERS = {
  "user-agent": "Gork RSS (Discord bot)",
  accept: "application/rss+xml, application/atom+xml, application/xml, text/xml, */*",
};

const asFeedError = (err: unknown): FeedError =>
  err instanceof FeedError ? err : new FeedError(err instanceof Error ? err.message : String(err));

function parseUrl(target: string): URL {
  try {
    return new URL(target);
  } catch {
    throw new FeedError("not a valid URL");
  }
}

async function request(url: URL, fetchFn: FetchFn): Promise<Response> {
  try {
    return await fetchFn(url.href, {
      headers: HEADERS,
      redirect: "manual",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (err) {
    throw asFeedError(err);
  }
}

/** Follows redirects by hand so every hop's host is checked. */
async function follow(url: string, fetchFn: FetchFn, resolveHost: Lookup): Promise<Response> {
  let target = url;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const parsed = parseUrl(target);
    await checkHost(parsed, resolveHost);
    const res = await request(parsed, fetchFn);
    const location = res.headers.get("location");
    const redirect = res.status >= 300 && res.status < 400 && location;
    if (!redirect) return res;
    target = new URL(location, parsed).href;
  }
  throw new FeedError("too many redirects");
}

/** The body as text, refused past MAX_FEED_BYTES. */
async function readCapped(body: ReadableStream<Uint8Array>): Promise<string> {
  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (let next = await reader.read(); !next.done; next = await reader.read()) {
      size += next.value.byteLength;
      if (size > MAX_FEED_BYTES) throw new FeedError("feed is larger than 2 MB");
      chunks.push(next.value);
    }
  } catch (err) {
    throw asFeedError(err);
  } finally {
    await reader.cancel().catch(() => undefined);
  }
  return new TextDecoder().decode(Buffer.concat(chunks));
}

/** A feed's body as text; any failure (unsafe host, network, status, over 2 MB) is a FeedError. */
export async function fetchFeed(
  url: string,
  fetchFn: FetchFn = fetch,
  resolveHost: Lookup = resolve,
): Promise<string> {
  const res = await follow(url, fetchFn, resolveHost);
  if (!res.ok) throw new FeedError(`HTTP ${res.status}`);
  return res.body ? readCapped(res.body) : "";
}
