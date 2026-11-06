import { ButtonStyle } from "discord.js";
import { button, type Row, row } from "../../../core/buttons.ts";
import { NEW_ID, giveUpId } from "./ids.ts";
import type { BoardView } from "./types.ts";

/** Give up while playing (guesses are `/snake guess`); practice adds New, also once finished. */
export function controlRow(v: BoardView): Row[] {
  const play = [button(giveUpId(v.scope, v.stamp), "Give up", ButtonStyle.Danger)];
  const fresh = button(NEW_ID, "New", ButtonStyle.Success);
  const parts = [...(v.finished ? [] : play), ...(v.number === null ? [fresh] : [])];

  return parts.length > 0 ? [row(parts)] : [];
}
