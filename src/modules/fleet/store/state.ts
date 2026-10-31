import type { Game, Ship, Side } from "../types.ts";

export type State = Pick<Game, "phase" | "first" | "player" | "jevos" | "cursor" | "dir">;

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null;

const isCells = (v: unknown): v is number[] =>
  Array.isArray(v) && v.every((c) => Number.isInteger(c) && c >= 0 && c < 100);

const isShip = (v: unknown): v is Ship =>
  isObject(v) && Number.isInteger(v.kind) && isCells(v.cells);

const isSide = (v: unknown): v is Side =>
  isObject(v) && Array.isArray(v.ships) && v.ships.every(isShip) && isCells(v.shots);

function isState(v: unknown): v is State {
  if (!isObject(v) || !isSide(v.player) || !isSide(v.jevos)) return false;

  const phase = v.phase === "placing" || v.phase === "playing";
  const first = v.first === "player" || v.first === "jevos";

  return phase && first && (v.dir === "across" || v.dir === "down") && isCells([v.cursor]);
}

export const encodeState = (g: Game): string =>
  JSON.stringify({
    phase: g.phase,
    first: g.first,
    player: g.player,
    jevos: g.jevos,
    cursor: g.cursor,
    dir: g.dir,
  } satisfies State);

/** The stored state, or null when the JSON is unreadable or the wrong shape. */
export function decodeState(json: string): State | null {
  try {
    const v: unknown = JSON.parse(json);

    return isState(v) ? v : null;
  } catch {
    return null;
  }
}
