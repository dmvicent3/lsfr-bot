import { earnedBy } from "../../../core/points.ts";
import { reply } from "../../../core/replies.ts";
import { coinsOf, fiftyFifty } from "../engine/streaks.ts";
import { ledgerOf } from "../pull/ledger.ts";
import { gachaPrice } from "../settings.ts";
import { balanceText } from "../text/balance.ts";
import type { CommandCtx } from "./types.ts";

/** Private: the balance, the points behind it by game, and both banners' counters. */
export async function balance({ i, who, repo, sources }: CommandCtx): Promise<void> {
  const text = balanceText({
    ledger: ledgerOf({ repo, sources }, who),
    games: earnedBy(sources, repo.db, who),
    price: gachaPrice(repo.db, who.guildId),
    limited: repo.pity.get(who, "limited"),
    standard: repo.pity.get(who, "standard"),
    fifty: fiftyFifty(coinsOf(repo.pulls.limitedFives(who))),
  });

  await reply(i, text);
}
