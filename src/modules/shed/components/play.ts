import type { ComponentHandler } from "../../../core/types.ts";
import { inHand, turnClick } from "./answer.ts";
import { PLAYS } from "./replies.ts";

/** `shed:play:<turn>:<card>:<n>:<last>`: n copies of a card from the hand; last 1 calls "Last card!". */
export const playHandler: ComponentHandler = {
  id: "shed:play",
  handle: (i, [turn, key = "", count, last]) =>
    inHand(i, async (r) => {
      const c = { ...turnClick(i, turn), key, count: Number(count) || 1, last: last === "1" };
      const out = await r.onPlay(c);

      return { note: PLAYS[out.result], hand: out.hand };
    }),
};
