import type { CycleDeps } from "./types.ts";
import type { Feed } from "../store/types.ts";
import type { Server } from "../store/types.ts";
import { classify } from "./classify.ts";
import { collect } from "./collect.ts";
import { expiryCutoff, notice } from "./decisions.ts";
import { renderItem } from "./render.ts";

/** Finished items are kept this long for dedupe (far longer than an item stays in a 50-item feed). */
const KEEP_MS = 30 * 24 * 3_600_000;
const MAX_POST = 50;
const DOWN = "⚠️ jev is down, new articles will be checked once it's back.";
const BACK = "✅ jev is back.";

/** Tells the channel when jev goes down or comes back, once each way. */
async function announce(server: Server, d: CycleDeps): Promise<void> {
  const change = notice(server.jevDown, await classify(server, d));
  if (!change) return;
  d.repo.servers.setJevDown(server.guildId, change === "down");
  await d.say(server.channelId, change === "down" ? DOWN : BACK);
}

/** Posts passed items, oldest first; a channel the bot lost stops the server's checks. */
async function postPassed(server: Server, feeds: Feed[], d: CycleDeps): Promise<void> {
  const names = new Map(feeds.map((f) => [f.id, f.name]));
  for (const item of d.repo.items.inState(server.guildId, "passed", MAX_POST)) {
    const embed = renderItem(item, names.get(item.feedId) ?? "RSS");
    const result = await d.post(server.channelId, embed);
    if (result === "ok") d.repo.items.setState(item.id, "posted");
    if (result === "lost-channel") {
      d.repo.servers.setChannel(server.guildId, null);
      return;
    }
  }
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
