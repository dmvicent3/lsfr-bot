import type { Row } from "../../../core/buttons.ts";
import { boardText } from "./board.ts";
import { controlRow } from "./buttons.ts";
import { clueSelect, type SelectRow } from "./select.ts";
import type { BoardView } from "./types.ts";

/** The game message: board and, while playing, the clue select with Reveal / Give up. */
export function crosswordView(v: BoardView) {
  const select = v.finished ? [] : [clueSelect(v)];
  const components: (Row | SelectRow)[] = [...select, ...controlRow(v)];

  return { content: boardText(v), components, allowedMentions: { parse: [] as [] } };
}
