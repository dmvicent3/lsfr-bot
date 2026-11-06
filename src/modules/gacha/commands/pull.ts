import { MessageFlags } from "discord.js";
import { log } from "../../../core/log.ts";
import type { BannerKind } from "../engine/types.ts";
import { runPull } from "../pull/run.ts";
import { gachaPrice } from "../settings.ts";
import { shortText } from "../text/pull.ts";
import { ensureBanner } from "../weekly/ensure.ts";
import { weeklyDeps } from "../weekly/job.ts";
import { pullMessages } from "./pull-reply.ts";
import type { CommandCtx } from "./types.ts";

const kindOf = (s: string | null): BannerKind => (s === "standard" ? "standard" : "limited");

/** Private: the cards, counters and balance. Each ★5 is also posted publicly. */
export async function pull(c: CommandCtx): Promise<void> {
  const { i, who, repo, roster } = c;
  const kind = kindOf(i.options.getString("banner"));
  const count = i.options.getInteger("count") === 10 ? 10 : 1;
  await i.deferReply({ flags: MessageFlags.Ephemeral });
  const featured =
    kind === "limited"
      ? (await ensureBanner(weeklyDeps(c.ctx, c.random), who.guildId)).featured
      : null;
  const price = gachaPrice(repo.db, who.guildId);
  const deps = { repo, sources: c.sources, pools: roster.pools, random: c.random };
  const out = runPull(deps, { who, kind, count, price, featured, now: Date.now() });

  if (!out.ok) {
    await i.editReply({ content: shortText({ ...out, price }) });

    return;
  }

  const { reply, news } = pullMessages({ roster, userId: who.userId, kind, out });
  await i.editReply(reply);

  for (const message of news) {
    await i
      .followUp(message)
      .catch((err: unknown) => log.error("gacha:pull", "★5 news failed", err));
  }
}
