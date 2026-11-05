import { MAX_MISTAKES } from "../play/guess.ts";
import type { Game, Puzzle } from "../types.ts";
import { COLOURS } from "./lines.ts";
import type { BoardView } from "./types.ts";

const plural = (n: number, word: string): string => `${n} ${word}${n === 1 ? "" : "s"}`;

/** How an unsolved round ended. */
const lossText = (mistakes: number): string =>
  mistakes >= MAX_MISTAKES ? "Out of mistakes" : "Gave up";

/** The found groups' colours in solve order, e.g. `🟨🟪🟩🟦`. */
const foundColours = (puzzle: Puzzle, found: string): string =>
  found
    .split("")
    .map((g) => COLOURS[puzzle.groups[parseInt(g, 16)]?.level ?? 0])
    .join("");

/** The public line for a finished daily. */
export function resultLine(number: number, g: Game, puzzle: Puzzle): string {
  const found = foundColours(puzzle, g.found);
  const name = `Groups #${number}`;

  if (!g.solved) {
    const verb = g.mistakes >= MAX_MISTAKES ? "ran out of mistakes on" : "gave up on";

    return `<@${g.userId}> ${verb} ${name} — ${found.length > 0 ? found : "no groups"}`;
  }

  return `<@${g.userId}> solved ${name} — ${g.points ?? 0} pts · ${plural(g.mistakes, "mistake")} · ${found}`;
}

function dailyLines(v: BoardView): string[] {
  if (!v.solved) return [`${lossText(v.progress.mistakes)} — 0 points`];

  return [...(v.award?.parts ?? []), `**${v.award?.points ?? 0} points**`];
}

const practiceLines = (v: BoardView): string[] => [
  v.solved ? "Solved!" : lossText(v.progress.mistakes),
  `Mistakes: ${v.progress.mistakes}`,
];

/** What follows the board once finished: the outcome, and for a daily the time to the next. */
export function resultLines(v: BoardView): string[] {
  if (!v.finished) return [];

  const next = v.number !== null && v.untilNext ? ["", `Next groups in ${v.untilNext}`] : [];

  return [...(v.number === null ? practiceLines(v) : dailyLines(v)), ...next];
}
