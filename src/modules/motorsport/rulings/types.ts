import type { FetchFn } from "../../../core/types.ts";
import type { EventSchedule, Post } from "../types.ts";
import type { MotorsportRepo } from "../repo.ts";

export interface RulingDeps {
  fetchFn: FetchFn;
  /** A PDF's text, laid out (pdftotext -layout). */
  pdfText: (pdf: Uint8Array) => Promise<string>;
  /** Gemini; may throw (down, out of quota), and then the ruling posts without it. */
  summarize: (prompt: string) => Promise<string>;
  post: Post;
}

export interface FiaDocument {
  url: string;
  /** Without the "Doc 61 - " prefix. */
  title: string;
  publishedAt: Date;
}

export interface FiaPage {
  /** The event the listed documents belong to, e.g. "Singapore Grand Prix". */
  event: string | null;
  documents: FiaDocument[];
}

/** A stewards' ruling's labelled fields, whitespace collapsed. */
export interface Ruling {
  car: string;
  driver: string;
  competitor: string;
  session: string;
  fact: string;
  infringement: string;
  decision: string;
  reason: string;
}

/** One collectRulings run: the weekend it checks and what it needs. */
export interface RulingRun {
  repo: MotorsportRepo;
  now: number;
  deps: RulingDeps;
  event: EventSchedule;
}

/** A ruling document checked: `posted` false means it wasn't a post-session ruling. */
export interface RulingMark {
  eventId: string;
  url: string;
  posted: boolean;
  now: number;
}
