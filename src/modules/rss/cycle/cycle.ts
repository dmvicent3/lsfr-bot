import type { CycleDeps } from "./types.ts";
import type { Server } from "../store/types.ts";
import { classify } from "./classify.ts";
import { collect } from "./collect.ts";
import { expiryCutoff, notice } from "./decisions.ts";
import { postPassed } from "./post.ts";

/** Finished items are kept this long for dedupe (far longer than an item stays in a 50-item feed). */
const KEEP_MS = 30 * 24 * 3_600_000;
const DOWN = "⚠️ jev is down, new articles will be checked once it's back.";
const BACK = "✅ jev is back.";

/** Tells the channel when jev goes down or comes back, once each way. */
async function announce(server: Server, d: CycleDeps): Promise<void> {
  const change = notice(server.jevDown, await classify(server, d));

  if (!change) return;

  d.repo.servers.setJevDown(server.guildId, change === "down");
  await d.say(server.channelId, change === "down" ? DOWN : BACK);
}

/** One check of one server: collect, expire, classify, notices, post. */
export async function runCycle(server: Server, d: CycleDeps): Promise<void> {
  const feeds = d.repo.feeds.list(server.guildId);
  await collect(server, feeds, d);
  d.repo.items.expire(server.guildId, expiryCutoff(d.now()));
  d.repo.items.prune(server.guildId, d.now() - KEEP_MS);
  await announce(server, d);
  await postPassed(server, feeds, d);
}
