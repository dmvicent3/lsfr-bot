export type SeriesKey = "f1" | "wec" | "wrc" | "indycar" | "motogp" | "fe" | "f2" | "f3";

export interface ParsedSession {
  series: SeriesKey;
  eventId: string;
  eventName: string;
  sessionId: string;
  title: string;
  start: Date;
  end: Date;
  /** Source's own "this session matters" flag (Tunous only; false for sportstimes). */
  significant: boolean;
}

export interface Session extends Omit<ParsedSession, "significant"> {
  pingable: boolean;
}

export interface EventSchedule {
  eventId: string;
  eventName: string;
  /** Sorted by start. */
  sessions: Session[];
}

export class SourceFormatError extends Error {
  override name = "SourceFormatError";
}
