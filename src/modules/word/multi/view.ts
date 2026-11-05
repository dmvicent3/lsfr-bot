import { ButtonStyle } from "discord.js";
import { button, row } from "../../../core/buttons.ts";
import { multiText, type MultiTextView } from "./board-text.ts";
import { giveUpId } from "./ids.ts";

/** The board message: the text, and Give up while the game is open (guesses are `/duo guess`). */
export function multiView(v: MultiTextView) {
  const { mode, date } = v.puzzle;
  const controls = row([button(giveUpId(mode, date), "Give up", ButtonStyle.Danger)]);

  return {
    content: multiText(v),
    components: v.game?.finishedAt ? [] : [controls],
    allowedMentions: { parse: [] as [] },
  };
}
