import { keptLine, enter } from "./answer.ts";
import type { Entry, PlayState, Typed } from "./types.ts";

/**
 * Writes the words typed into a cell's modal, in order (across first): an empty input skips its
 * slot, any invalid one makes the whole submit bad. Never finishes; the line names every slot whose
 * revealed letters were kept.
 */
export function enterWords(state: PlayState, typed: Typed[]): Entry {
  if (state.finished) return { kind: "stale" };

  let cells = state.cells;
  const clashed = [];

  for (const t of typed) {
    if (t.text.trim() === "") continue;

    const entry = enter({ ...state, cells }, t.slot, t.text, state.cells);

    if (entry.kind !== "entered") return entry;

    cells = entry.cells;

    if (entry.line) clashed.push(state.puzzle.slots[t.slot]!);
  }

  return { kind: "entered", cells, line: keptLine(clashed) };
}
