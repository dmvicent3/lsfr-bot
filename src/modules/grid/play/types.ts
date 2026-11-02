import type { Snapshot } from "../../../core/countries/types.ts";
import type { Grid } from "../types.ts";

export interface PlayState {
  grid: Grid;
  cells: string[];
  guesses: number;
  finished: boolean;
}

/** What a guess is judged against. */
export interface Reference {
  snapshot: Snapshot;
  obscurity: Map<string, number>;
}

/** What one cell submission does; callers persist cells and guesses. */
export type Outcome =
  | { kind: "stale" }
  | { kind: "unknown"; text: string }
  | { kind: "used"; name: string }
  | { kind: "nodata"; name: string; label: string }
  | { kind: "miss"; name: string; reasons: string[]; cells: string[]; guesses: number }
  | { kind: "hit"; iso2: string; points: number; cells: string[]; guesses: number };
