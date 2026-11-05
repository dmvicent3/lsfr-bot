import { fromHex } from "../play/hex.ts";
import { groupLine, mistakesLeft } from "./lines.ts";
import { resultLines } from "./result.ts";
import type { BoardView } from "./types.ts";

function header(v: BoardView): string {
  const name = v.number === null ? "Practice groups" : `Groups #${v.number}`;

  return `**${name}** · Mistakes left ${mistakesLeft(v.progress.mistakes)}`;
}

/** Found groups in solve order; once finished, the missed ones follow. */
function groupLines(v: BoardView): string[] {
  const found = fromHex(v.progress.found);
  const lines = found.flatMap((g) => {
    const group = v.puzzle.groups[g];

    return group ? [groupLine(group)] : [];
  });
  const missed = v.puzzle.groups.filter((_, g) => !found.includes(g)).map(groupLine);

  return v.finished && missed.length > 0 ? [...lines, "Missed:", ...missed] : lines;
}

/** The header line, the groups, the last line and, once finished, the result. */
export function boardText(v: BoardView): string {
  const tail = resultLines(v);
  const last = v.progress.lastLine && !v.finished ? [v.progress.lastLine] : [];
  const body = [...groupLines(v), ...last];

  return [header(v), ...body, ...(tail.length > 0 ? ["", ...tail] : [])].join("\n");
}
