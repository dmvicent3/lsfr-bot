import { enter } from "./answer.ts";
import { checkLine, verdict } from "./check.ts";
import { isCorrect } from "./cells.ts";
import { REVEAL_LINE, reveal, revealRandom } from "./reveal.ts";
import { end, keep } from "./round.ts";
import { type Entry, isGame, type Landed, type PlayState, type Turn } from "./types.ts";

const stateOf = ({ rec, puzzle }: Turn): PlayState => ({
  puzzle,
  cells: rec.cells,
  wrong: rec.wrong,
  reveals: rec.reveals,
  finished: rec.finishedAt !== null,
});

const unchanged = (t: Turn): Landed => ({ game: t.rec, award: null });

/** Writes a typed word and stores it; never finishes. `landed` is null when nothing was stored. */
export function answerSlot(
  t: Turn,
  slotIndex: number,
  text: string,
): { entry: Entry; landed: Landed | null } {
  const entry = enter(stateOf(t), slotIndex, text);

  if (entry.kind !== "entered") return { entry, landed: null };

  return { entry, landed: keep(t.repo, { ...t.rec, cells: entry.cells, lastLine: entry.line }) };
}

/** Checks a full grid: right finishes solved, wrong costs a check. Otherwise nothing changes. */
export function checkGrid(t: Turn): Landed {
  if (t.rec.finishedAt !== null) return unchanged(t);

  const v = verdict(stateOf(t));

  if (v === "correct") return end(t.repo, t.rec, true, t.now);

  if (v === "incomplete") return unchanged(t);

  const line = checkLine(isGame(t.rec));

  return keep(t.repo, { ...t.rec, wrong: t.rec.wrong + 1, lastLine: line });
}

/** Reveals one letter; a grid it completes correctly finishes, one already right acts as Check. */
export function revealLetter(t: Turn): Landed {
  if (t.rec.finishedAt !== null) return unchanged(t);

  const r = reveal(stateOf(t), revealRandom(t.rec));

  if (!r) return end(t.repo, t.rec, true, t.now);

  const rec = { ...t.rec, cells: r.cells, reveals: r.reveals, lastLine: REVEAL_LINE };

  return isCorrect(t.puzzle, r.cells) ? end(t.repo, rec, true, t.now) : keep(t.repo, rec);
}
