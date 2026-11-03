import type { CrosswordRepo } from "../store/repo.ts";
import type { Puzzle } from "../types.ts";
import { submit } from "./answer.ts";
import { REVEAL_LINE, reveal, revealRandom } from "./reveal.ts";
import { land } from "./round.ts";
import type { Landed, Outcome, PlayState, Rec } from "./types.ts";

/** One player's round at a moment: where to store it, the puzzle it plays, the clock. */
export interface Turn {
  repo: CrosswordRepo;
  rec: Rec;
  puzzle: Puzzle;
  now: number;
}

const stateOf = ({ rec, puzzle }: Turn): PlayState => ({
  puzzle,
  cells: rec.cells,
  wrong: rec.wrong,
  reveals: rec.reveals,
  finished: rec.finishedAt !== null,
});

/** Judges an answer and stores what it changed; `landed` is null when nothing was stored. */
export function answerSlot(
  t: Turn,
  slotIndex: number,
  text: string,
): { outcome: Outcome; landed: Landed | null } {
  const outcome = submit(stateOf(t), slotIndex, text);

  if (outcome.kind === "hit") {
    return {
      outcome,
      landed: land(t.repo, { ...t.rec, cells: outcome.cells, lastLine: null }, t.now),
    };
  }

  if (outcome.kind === "miss") {
    const rec = { ...t.rec, wrong: outcome.wrong, lastLine: outcome.line };

    return { outcome, landed: land(t.repo, rec, t.now) };
  }

  return { outcome, landed: null };
}

/** Reveals one letter and stores it; a finished round is left as it is. */
export function revealLetter(t: Turn): Landed {
  if (t.rec.finishedAt !== null) return { game: t.rec, award: null };

  const r = reveal(stateOf(t), revealRandom(t.rec));
  const rec = { ...t.rec, cells: r.cells, reveals: r.reveals, lastLine: REVEAL_LINE };

  return land(t.repo, rec, t.now);
}
