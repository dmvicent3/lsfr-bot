import type { Outcome } from "../types.ts";
import type { Finish } from "./types.ts";

/** The result a finished outcome records; null while the game goes on. */
export function outcomeFinish(o: Outcome, endedAt: number): Finish | null {
  if (o.kind === "playing") return null;

  if (o.kind === "win")
    return { result: o.winner === "player" ? "win" : "loss", how: "four", endedAt };

  if (o.kind === "draw") return { result: "draw", how: "full", endedAt };

  return { result: "loss", how: o.kind, endedAt };
}

/** A live game given up for a new one. */
export const REPLACED = (endedAt: number): Finish => ({ result: "loss", how: "replaced", endedAt });
