import { pickWord } from "../play/turn.ts";
import { wordIndexOf } from "../render/ids.ts";
import { moveHandler } from "./move.ts";

/** `groups:pick:<scope>:<stamp>:<word>`: selects or unselects one word. */
export const pickHandler = moveHandler("pick", (t, [part]) => {
  const word = wordIndexOf(part);

  return word === null ? { game: t.rec, award: null } : pickWord(t, word);
});
