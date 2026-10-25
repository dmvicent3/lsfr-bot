import type { SeriesKey, Session } from "../types.ts";

export interface Upcoming {
  name: string;
  session: Session;
  live: boolean;
  channelId: string | undefined;
}

export interface RefreshResult {
  series: SeriesKey;
  ok: boolean;
  error?: string;
}

/** An event's sessions that start within the forecast range. */
export interface UpcomingEvent {
  eventId: string;
  sessions: Session[];
}
