import { elapsedSeconds } from "./outcome.ts";
import { PRESETS } from "./setup.ts";
import type { FinishedRow, Preset, Setup, SetupLine, Stats } from "./types.ts";

const MAX_LINES = 10;

const PRESET_ORDER: Preset[] = ["beginner", "intermediate", "expert"];

const PRESET_LABELS: Record<Preset, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  expert: "Expert",
};

const setupKey = (s: Setup): string => `${s.width}×${s.height}/${s.mines}`;

/** Preset label → its order; a setup matching a preset is listed under the preset's name. */
const PRESET_BY_KEY = new Map(
  PRESET_ORDER.map((p, order) => [setupKey(PRESETS[p]), { label: PRESET_LABELS[p], order }]),
);

function streaks(rows: FinishedRow[]): { streak: number; bestStreak: number } {
  let streak = 0;
  let bestStreak = 0;

  for (const r of rows) {
    streak = r.result === "won" ? streak + 1 : 0;
    bestStreak = Math.max(bestStreak, streak);
  }

  return { streak, bestStreak };
}

function setupLines(rows: FinishedRow[]): SetupLine[] {
  const lines = new Map<string, SetupLine>();

  for (const r of rows) {
    const key = setupKey(r);
    const line = lines.get(key) ?? { label: key, games: 0, wins: 0, bestSeconds: Infinity };
    const won = r.result === "won";
    const seconds = elapsedSeconds(r.startedAt, r.finishedAt);
    lines.set(key, {
      ...line,
      games: line.games + 1,
      wins: line.wins + (won ? 1 : 0),
      bestSeconds: won ? Math.min(line.bestSeconds, seconds) : line.bestSeconds,
    });
  }

  return [...lines.values()].filter((l) => l.wins > 0);
}

const rank = (l: SetupLine): number => PRESET_BY_KEY.get(l.label)?.order ?? Infinity;

const named = (l: SetupLine): SetupLine => ({
  ...l,
  label: PRESET_BY_KEY.get(l.label)?.label ?? l.label,
});

/** Presets first in their own order, then other setups by games played. */
function ordered(lines: SetupLine[]): SetupLine[] {
  return lines
    .toSorted((a, b) => rank(a) - rank(b) || b.games - a.games)
    .slice(0, MAX_LINES)
    .map(named);
}

/** A player's stats from their finished games, oldest first; null with none. */
export function rollup(rows: FinishedRow[]): Stats | null {
  if (rows.length === 0) return null;

  const wins = rows.filter((r) => r.result === "won").length;

  return { games: rows.length, wins, ...streaks(rows), setups: ordered(setupLines(rows)) };
}
