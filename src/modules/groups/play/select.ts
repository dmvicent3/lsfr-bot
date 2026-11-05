import { GROUP_SIZE } from "../generate/pick.ts";
import type { Progress } from "../types.ts";
import { fromHex, toHex } from "./hex.ts";
import { unsolved } from "./words.ts";

/**
 * Selects or unselects a word on the board; null when nothing changes (not on the board, or a
 * fifth pick). The selection stays sorted.
 */
export function toggle<P extends Progress>(p: P, word: number): P | null {
  if (!unsolved(p.order, p.found).includes(word)) return null;

  const picked = fromHex(p.picked);

  if (picked.includes(word)) return { ...p, picked: toHex(picked.filter((w) => w !== word)) };

  if (picked.length >= GROUP_SIZE) return null;

  return { ...p, picked: toHex([...picked, word].toSorted((a, b) => a - b)) };
}

/** Nothing selected; null when nothing was. */
export const clear = <P extends Progress>(p: P): P | null => (p.picked ? { ...p, picked: "" } : null);
