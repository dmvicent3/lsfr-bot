import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { FeedError } from "./parse.ts";

export type Lookup = (host: string) => Promise<string[]>;

export const resolve: Lookup = async (host) =>
  (await lookup(host, { all: true })).map((a) => a.address);

/** [first octet, second octet from, to]: blocks that aren't the public internet. */
const PRIVATE_V4: readonly (readonly [number, number, number])[] = [
  [0, 0, 255],
  [10, 0, 255],
  [127, 0, 255],
  [100, 64, 127],
  [169, 254, 254],
  [172, 16, 31],
  [192, 168, 168],
];
const MULTICAST_V4 = 224;
const PRIVATE_V6 = [/^::1?$/, /^f[cd]/, /^fe[89ab]/, /^ff/];
const MAPPED_V4 = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/;
const UNREACHABLE = "that host is not reachable from here";

function privateV4(ip: string): boolean {
  const [a = 0, b = 0] = ip.split(".").map(Number);
  return a >= MULTICAST_V4 || PRIVATE_V4.some(([x, lo, hi]) => a === x && b >= lo && b <= hi);
}

/** Loopback, private, link-local, CGNAT, multicast or unspecified: not somewhere a feed lives. */
export function isInternalAddress(ip: string): boolean {
  if (isIP(ip) === 4) return privateV4(ip);
  const v6 = ip.toLowerCase();
  const mapped = MAPPED_V4.exec(v6)?.[1];
  if (mapped) return privateV4(mapped);
  return PRIVATE_V6.some((re) => re.test(v6));
}

const internalName = (host: string): boolean =>
  !host.includes(".") || host.endsWith(".local") || host.endsWith(".internal");

async function addressesOf(host: string, resolveHost: Lookup): Promise<string[]> {
  try {
    return await resolveHost(host);
  } catch {
    throw new FeedError(`can't find ${host}`);
  }
}

/** Refuses URLs that point into the bot's own network (compose services, the LAN, localhost). */
export async function checkHost(url: URL, resolveHost: Lookup): Promise<void> {
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new FeedError("not an http(s) URL");
  }
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (isIP(host)) {
    if (isInternalAddress(host)) throw new FeedError("that address is not reachable from here");
    return;
  }
  if (internalName(host)) throw new FeedError(UNREACHABLE);
  const addresses = await addressesOf(host, resolveHost);
  if (addresses.length === 0 || addresses.some(isInternalAddress)) {
    throw new FeedError(UNREACHABLE);
  }
}
