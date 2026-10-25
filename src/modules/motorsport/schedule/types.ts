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
