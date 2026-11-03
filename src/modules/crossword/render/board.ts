import { clip } from "../../../core/clip.ts";
import { CLUE_MAX } from "../clues/write.ts";
import { filledSlots } from "../play/cells.ts";
import type { Dir } from "../types.ts";
import { clock, DIR_NAME } from "./labels.ts";
import { resultLines } from "./result.ts";
import type { BoardView } from "./types.ts";

/** Discord's budget for all the text of a Components V2 message. */
export const TEXT_MAX = 4000;

function header(v: BoardView): string {
  const { puzzle } = v.stored;
  const filled = filledSlots(puzzle, v.cells);
  const words = `Words ${filled.filter(Boolean).length}/${filled.length}`;

  if (v.number === null) {
    return `Practice crossword ${puzzle.size}×${puzzle.size} · ${words} · ${clock(v.elapsedMs)}`;
  }

  return `Crossword #${v.number} · ${words} · ${v.points} pts · ${clock(v.elapsedMs)}`;
}

function clueLine(v: BoardView, i: number, cap: number): string {
  const { puzzle, clues } = v.stored;
  const tail = v.finished
    ? ` — ${puzzle.answers[i]!.toUpperCase()}`
    : ` (${puzzle.slots[i]!.cells.length})`;

  return `${puzzle.slots[i]!.n}. ${clip(clues[i]!, cap)}${tail}`;
}

function list(v: BoardView, dir: Dir, cap: number): string[] {
  const lines = v.stored.puzzle.slots.flatMap((s, i) =>
    s.dir === dir ? [clueLine(v, i, cap)] : [],
  );

  return [`**${DIR_NAME[dir]}**`, ...lines];
}

function build(v: BoardView, cap: number): string {
  const tail = resultLines(v);

  return [
    ...list(v, "a", cap),
    ...list(v, "d", cap),
    ...(v.lastLine ? [v.lastLine] : []),
    ...(tail.length > 0 ? ["", ...tail] : []),
  ].join("\n");
}

/**
 * The header line and the body (clue lists, last line, result); every clue is cut with `…` to the
 * same length, the longest that keeps both within the text budget.
 */
export function boardText(v: BoardView): { header: string; body: string } {
  const head = header(v);

  for (let cap = CLUE_MAX; cap > 1; cap--) {
    const body = build(v, cap);

    if (head.length + body.length <= TEXT_MAX) return { header: head, body };
  }

  return { header: head, body: build(v, 1) };
}
