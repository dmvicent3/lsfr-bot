import type { Game, Step } from "../types.ts";

/** The game unchanged, with an optional note. */
export function unchanged(game: Game, note: string | null = null): Step {
  return { game, note, solved: false };
}

/** The unchanged step when the cell can't be edited, else null. */
export function blocked(game: Game): Step | null {
  if (game.solvedAt !== null) return unchanged(game);

  if (game.givens[game.cursor] !== "0") return unchanged(game, "That's a given.");

  return null;
}

/** `s` with the character at `i` replaced. */
export function setChar(s: string, i: number, ch: string): string {
  return s.slice(0, i) + ch + s.slice(i + 1);
}
