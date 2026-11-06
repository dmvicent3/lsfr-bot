import type { InteractionEditReplyOptions, InteractionReplyOptions } from "discord.js";
import type { BannerKind, Landed, Pity } from "../engine/types.ts";
import { cardPng, tenPng } from "../render/images.ts";
import { showOrder } from "../render/order.ts";
import { fiveNews, pullText } from "../text/pull.ts";
import type { Driver, Roster } from "../types.ts";

const PULL_FILE = "gacha-pull.png";

interface Shown {
  landed: Landed;
  driver: Driver;
}

function shownOf(roster: Roster, landed: readonly Landed[]): Shown[] {
  return showOrder(landed).map((l) => {
    const driver = roster.byId.get(l.driverId);

    if (!driver) throw new Error(`gacha: no driver ${l.driverId}`);

    return { landed: l, driver };
  });
}

/** One card for a single pull, the grid for more; the best pull first and marked. */
function image(shown: readonly Shown[]): Buffer {
  const [only] = shown;

  if (shown.length === 1 && only) return cardPng(only.driver, only.landed);

  return tenPng(
    shown.map((s, n) => ({
      driver: s.driver,
      level: s.landed.level,
      isNew: s.landed.isNew,
      best: n === 0,
    })),
  );
}

/** The private reply, and one public post per ★5 pulled. */
export function pullMessages(v: {
  roster: Roster;
  userId: string;
  kind: BannerKind;
  out: { landed: Landed[]; pity: Pity; balance: number; cost: number };
  /** Each new limited ★5's 50/50 streak. */
  runs?: ReadonlyMap<Landed, number>;
}): { reply: InteractionEditReplyOptions; news: InteractionReplyOptions[] } {
  const shown = shownOf(v.roster, v.out.landed);
  const content = pullText({ kind: v.kind, shown, ...v.out });
  const news = shown
    .filter((s) => s.landed.tier === 5)
    .map((s) => ({
      content: fiveNews({ ...s, userId: v.userId, kind: v.kind, run: v.runs?.get(s.landed) }),
      files: [{ attachment: cardPng(s.driver, s.landed), name: "gacha-five.png" }],
      allowedMentions: { parse: [] },
    }));

  return {
    reply: {
      content,
      files: [{ attachment: image(shown), name: PULL_FILE }],
      allowedMentions: { parse: [] },
    },
    news,
  };
}
