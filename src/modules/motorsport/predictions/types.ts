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
