import type { Game, Snapshot } from "../types.ts";

/** Undo reaches back this many edits; older ones are dropped. */
const CAP = 50;

/** `history` as a list; only this file writes it, so the JSON is trusted. */
const list = (history: string): Snapshot[] => (history === "" ? [] : JSON.parse(history));

const store = (snapshots: Snapshot[]): string =>
  snapshots.length === 0 ? "" : JSON.stringify(snapshots);

/** `history` with `s` added as the newest, keeping the newest `CAP`. */
export function push(history: string, s: Snapshot): string {
  return store([...list(history), s].slice(-CAP));
}

/** The newest snapshot and the history without it; null when there is none. */
export function pop(history: string): { snapshot: Snapshot; history: string } | null {
  const all = list(history);
  const snapshot = all.at(-1);

  return snapshot ? { snapshot, history: store(all.slice(0, -1)) } : null;
}

/** `after` with `before` pushed onto its history, when the edit changed cells or notes. */
export function record(before: Game, after: Game): Game {
  if (after.cells === before.cells && after.notes === before.notes) return after;

  const { cells, notes, cursor } = before;

  return { ...after, history: push(before.history, { cells, notes, cursor }) };
}
