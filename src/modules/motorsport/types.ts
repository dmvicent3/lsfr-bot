import type { ResultKind, ResultRow } from "./results/types.ts";

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

/** Where a weekend post goes: the series channel, or that weekend's results thread. */
export interface PostTarget {
  series: SeriesKey;
  eventId: string;
  eventName: string;
  place: "channel" | "thread";
}

export interface PostMessage {
  content: string;
  /** Text attachments, previewed inline by Discord. */
  files?: { name: string; data: string }[];
}

export type Post = (target: PostTarget, message: PostMessage) => Promise<void>;

/** A session's classification, kept once posted (also the record F4 predictions score against). */
export interface StoredResult {
  series: SeriesKey;
  eventId: string;
  eventName: string;
  sessionId: string;
  kind: ResultKind;
  rows: ResultRow[];
  postedAt: number;
}

export interface Followed {
  series: SeriesKey;
  channelId: string;
  roleId: string;
  pinnedMessageId: string;
  pinnedEventId: string | null;
  channelName: string | null;
  renamedAt: number | null;
}

export interface SentPing {
  series: SeriesKey;
  eventId: string;
  sessionId: string;
  channelId: string;
  /** null = the session was handled but there was nobody to ping. */
  messageId: string | null;
  deleteAt: number;
}

export type DuePing = Omit<SentPing, "messageId" | "deleteAt"> & { messageId: string };

export interface SeriesInfo {
  key: SeriesKey;
  name: string;
  source: "tunous" | "sportstimes";
  /** Folder name in the source repo. */
  path: string;
}

/** Who is acting on a button or command, and when. */
export interface Viewer {
  userId: string;
  now: number;
}

/** One session of one event, as buttons and commands name it. */
export interface SessionRef {
  series: SeriesKey;
  eventId: string;
  sessionId: string;
}
