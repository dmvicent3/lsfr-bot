import type { SeriesInfo, Session } from "../types.ts";
import type { ResultRow } from "../results/types.ts";

export type PickOutcome =
  | { ok: true; picks: Picks; completed: boolean }
  | { ok: false; text: string };

/** P1, P2, P3 driver ids; null until picked. */
export type Picks = [string | null, string | null, string | null];

export type FullPicks = [string, string, string];

export interface Prediction {
  userId: string;
  picks: FullPicks;
}

export interface Score {
  points: number;
  perfect: boolean;
}

export interface Standing {
  userId: string;
  points: number;
  perfect: number;
  played: number;
}

export interface Driver {
  id: string;
  name: string;
}

/** What the podium picker shows one viewer for one session. */
export interface PickerView {
  info: SeriesInfo;
  eventName: string;
  session: Session;
  grid: readonly Driver[];
  picks: Picks;
  others: readonly Session[];
}

/** A driver chosen for podium position `index` (0 = P1). */
export interface PodiumPick {
  index: number;
  driverId: string;
}

/** A scored-to-be prediction: the picks and the result they're scored against. */
export interface SeasonEntry {
  userId: string;
  picks: FullPicks;
  rows: ResultRow[];
}
