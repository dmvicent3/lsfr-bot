import type { FetchFn } from "../../../core/types.ts";
import type { Post, SeriesInfo, Session } from "../types.ts";
import type { MotorsportRepo } from "../repo.ts";

export type ResultKind = "qualifying" | "sprint-qualifying" | "sprint" | "race";

/** A result to fetch: the session, its event's race (which locates MotoGP events) and its kind. */
export interface Wanted {
  session: Session;
  race: Session;
  kind: ResultKind;
}

/** One series' results source. */
export type Fetcher = (w: Wanted, fetchFn: FetchFn) => Promise<SessionResult | null>;

export interface MotogpEvent {
  eventId: string;
  categoryId: string;
}

export interface ResultRow {
  /** "1".."20", or "–" for an unclassified finisher. */
  pos: string;
  /** Stable across sessions (F1 car number, MotoGP rider id); names can change form. */
  id: string;
  name: string;
  team: string;
  /** Winner's time, a gap ("+3.123", "+1 lap"), a lap time, or "DNF". */
  time: string;
}

export interface SessionResult {
  rows: ResultRow[];
}

/** What a results post is headed with. */
export interface ResultHeading {
  info: SeriesInfo;
  eventName: string;
  kind: ResultKind;
}

/** What the results job needs to fetch, post and store a result. */
export interface CollectDeps {
  repo: MotorsportRepo;
  now: number;
  fetchFn: FetchFn;
  post: Post;
}
