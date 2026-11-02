import type { GameKey, Level } from "../types.ts";

const LEVELS: readonly string[] = ["easy", "medium", "hard"] satisfies Level[];

const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** The game a board's custom-ID suffix points at, for this player; null when it isn't one. */
export function parseKey(args: string[], userId: string, guildId: string): GameKey | null {
  if (args.length === 1 && args[0] === "practice") {
    return { guildId, userId, kind: "practice", date: "", slot: "" };
  }

  const [kind, date, level] = args;

  if (kind !== "daily" || args.length !== 3 || !date || !level) return null;

  if (!DATE.test(date) || !LEVELS.includes(level)) return null;

  return { guildId, userId, kind: "daily", date, slot: level };
}
