import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import type { FetchFn } from "../../core/guards.ts";
import { FeedError } from "./parse.ts";

export const MAX_FEED_BYTES = 2_000_000;
const TIMEOUT_MS = 20_000;
const MAX_REDIRECTS = 5;

export type Lookup = (host: string) => Promise<string[]>;

const resolve: Lookup = async (host) => (await lookup(host, { all: true })).map((a) => a.address);

function privateV4(ip: string): boolean {
  const [a = 0, b = 0] = ip.split(".").map(Number);
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    a >= 224 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168)
  );
}

/** Loopback, private, link-local, CGNAT, multicast or unspecified: not somewhere a feed lives. */
export function isInternalAddress(ip: string): boolean {
  if (isIP(ip) === 4) return privateV4(ip);
  const v6 = ip.toLowerCase();
  const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/.exec(v6);
  if (mapped?.[1]) return privateV4(mapped[1]);
  return (
    v6 === "::" || v6 === "::1" || /^f[cd]/.test(v6) || /^fe[89ab]/.test(v6) || v6.startsWith("ff")
  );
}

/** Refuses URLs that point into the bot's own network (compose services, the LAN, localhost). */
async function checkHost(url: URL, resolveHost: Lookup): Promise<void> {
  if (url.protocol !== "http:" && url.protocol !== "https:")
    throw new FeedError("not an http(s) URL");
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (isIP(host)) {
    if (isInternalAddress(host)) throw new FeedError("that address is not reachable from here");
    return;
  }
  if (!host.includes(".") || host.endsWith(".local") || host.endsWith(".internal")) {
    throw new FeedError("that host is not reachable from here");
  }
  let addresses: string[];
  try {
    addresses = await resolveHost(host);
  } catch {
    throw new FeedError(`can't find ${host}`);
  }
  if (addresses.length === 0 || addresses.some(isInternalAddress)) {
    throw new FeedError("that host is not reachable from here");
  }
}

/**
 * A feed's body as text; any failure (unsafe host, network, status, over 2 MB) is a FeedError with
 * a short reason. Redirects are followed by hand so every hop's host is checked.
 */
export async function fetchFeed(
  url: string,
  fetchFn: FetchFn = fetch,
  resolveHost: Lookup = resolve,
): Promise<string> {
  let target = url;
  let res: Response | null = null;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    let parsed: URL;
    try {
      parsed = new URL(target);
    } catch {
      throw new FeedError("not a valid URL");
    }
    await checkHost(parsed, resolveHost);
    try {
      res = await fetchFn(parsed.href, {
        headers: {
          "user-agent": "Gork RSS (Discord bot)",
          accept: "application/rss+xml, application/atom+xml, application/xml, text/xml, */*",
        },
        redirect: "manual",
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch (err) {
      throw new FeedError(err instanceof Error ? err.message : String(err));
    }
    const location = res.headers.get("location");
    if (res.status >= 300 && res.status < 400 && location) {
      target = new URL(location, parsed).href;
      res = null;
      continue;
    }
    break;
  }
  if (!res) throw new FeedError("too many redirects");
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
