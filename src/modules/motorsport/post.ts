import type { SeriesKey } from "./types.ts";

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
