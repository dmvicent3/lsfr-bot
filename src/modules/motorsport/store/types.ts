import type { ResultKind } from "../results/types.ts";
import type { SeriesKey } from "../types.ts";

export interface PicksRow {
  user_id: string;
  p1: string | null;
  p2: string | null;
  p3: string | null;
}

export interface FollowedRow {
  series: string;
  channel_id: string;
  role_id: string;
  pinned_message_id: string;
  pinned_event_id: string | null;
  channel_name: string | null;
  renamed_at: number | null;
}

export interface SessionRow {
  series: string;
  event_id: string;
  event_name: string;
  session_id: string;
  title: string;
  start: number;
  end: number;
  pingable: number;
}

export interface DueRow {
  series: string;
  event_id: string;
  session_id: string;
  channel_id: string;
  message_id: string;
}

export interface ChipRow {
  user_id: string;
  event_id: string;
  chip: string;
  session_id: string | null;
  position: number | null;
}

/** Where a chip is played: the series weekend and its season (UTC year). */
export interface ChipWeekend {
  series: SeriesKey;
  season: number;
  eventId: string;
}

/** A complete prediction joined with its session's result. */
export interface ScoredRow {
  user_id: string;
  event_id: string;
  session_id: string;
  kind: ResultKind;
  p1: string;
  p2: string;
  p3: string;
  rows_json: string;
}
