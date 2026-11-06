import type { EventSchedule, SeriesInfo, SeriesKey, Session } from "../types.ts";
import type { ResultKind, ResultRow } from "../results/types.ts";
import type { Chip, ChipMenu } from "./chip-types.ts";

export type { Chip, ChipKind, ChipMenu, ChipOption, PlayedChip } from "./chip-types.ts";

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
  pulls: number;
}

/**
 * How a series' predictions work: which sessions; `fantasy`: one lock per weekend (its first
 * predictable session) and chips; `pulls`: what a perfect (20-point) prediction pays per kind.
 */
export interface PredictionRules {
  kinds: readonly ResultKind[];
  fantasy: boolean;
  pulls: Partial<Record<ResultKind, number>>;
}

/** Who is looking, when, and whether their Late Swap keeps the race open past the lock. */
export interface OpenState {
  now: number;
  lateSwap: boolean;
}

/** Until when the viewer can change a session's picks, and why that moment. */
export interface LockPhase {
  phase: "session" | "weekend" | "lateswap";
  at: Date;
}

/** Per-pick points before chips, and the perfect-podium bonus. */
export interface PickScores {
  each: number[];
  bonus: number;
}

/** One scored prediction: points after the chip, the chip if it changed this session, pulls. */
export interface EntryScore extends Score {
  pulls: number;
  chip: Chip | null;
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
  lock: LockPhase;
  /** null for series without chips. */
  chips: ChipMenu | null;
}

/** A driver chosen for podium position `index` (0 = P1). */
export interface PodiumPick {
  index: number;
  driverId: string;
}

/** A scored-to-be prediction: the picks, the session, and the result they're scored against. */
export interface SeasonEntry {
  userId: string;
  eventId: string;
  sessionId: string;
  kind: ResultKind;
  picks: FullPicks;
  rows: ResultRow[];
}

/** Which scored predictions to read: a series' kinds, results posted since, maybe one player. */
export interface ScoredQuery {
  kinds: readonly ResultKind[];
  since: number;
  userId?: string;
}

/** One viewer's weekend: sessions, chip, what they can still change; `season` = the lock's UTC year. */
export interface Weekend {
  series: SeriesKey;
  event: EventSchedule;
  chip: Chip | null;
  locked: boolean;
  open: Session[];
  season: number;
}
