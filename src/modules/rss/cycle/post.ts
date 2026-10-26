import { EmbedError } from "../../../core/embed/http.ts";
import { log } from "../../../core/log.ts";
import { isRepeat } from "../dedupe/similar.ts";
import { storyText } from "../dedupe/story.ts";
import type { Feed, Server } from "../store/types.ts";
import type { Check, CycleDeps, Pass } from "./types.ts";
import { DAY_MS } from "./decisions.ts";
import { renderItem } from "./render.ts";

const MAX_POST = 50;

/** Embeds the story and compares it with the server's posts from the last day. */
async function check(text: string | null, pass: Pass): Promise<Check> {
  const { guildId, d } = pass;

  if (!d.embedder || !text) return null;

  const vector = await d.embedder.embed(text);
  const recent = d.repo.items.recentEmbeddings(guildId, d.now() - DAY_MS);

  return isRepeat(vector, recent) ? "repeat" : vector;
}

/** The check, or null when embed failed; only the first failure of a pass is logged. */
async function checkOrSkip(text: string | null, pass: Pass): Promise<Check> {
  try {
    return await check(text, pass);
  } catch (err) {
    if (!(err instanceof EmbedError)) throw err;

    if (!pass.logged) log.error("rss:dedupe", "embed failed, posting unchecked", err);

    pass.logged = true;

    return null;
  }
}

/** Posts passed items, oldest first, skipping repeats; a channel the bot lost stops the server's checks. */
export async function postPassed(server: Server, feeds: Feed[], d: CycleDeps): Promise<void> {
  const byId = new Map(feeds.map((f) => [f.id, f]));
  const pass: Pass = { guildId: server.guildId, d, logged: false };

  for (const item of d.repo.items.inState(server.guildId, "passed", MAX_POST)) {
    const feed = byId.get(item.feedId);
    const found = await checkOrSkip(storyText(item.title, feed?.url ?? ""), pass);

    if (found === "repeat") {
      d.repo.items.setState(item.id, "duplicate");
      continue;
    }

    const result = await d.post(server.channelId, renderItem(item, feed?.name ?? "RSS"));

    if (result === "ok") d.repo.items.setPosted(item.id, found);

    if (result === "lost-channel") {
      d.repo.servers.setChannel(server.guildId, null);

      return;
    }
  }
}
