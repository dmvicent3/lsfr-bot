import type { BannerKind, Featured, Pools, Tier } from "./engine/types.ts";

/** One driver of the snapshot. */
export interface Driver {
  id: string;
  name: string;
  /** ISO 3166-1 alpha-2. */
  country: string;
  first: number;
  last: number;
  titles: number;
  wins: number;
  /** Races started from grid slot 1. */
  poles: number;
  starts: number;
  tier: Tier;
}

/** Every driver, by id and by tier. */
export interface Roster {
  drivers: readonly Driver[];
  byId: ReadonlyMap<string, Driver>;
  pools: Pools;
}

/** A week's limited banner in one server. */
export interface Banner {
  guildId: string;
  /** The week's Monday, YYYY-MM-DD. */
  week: string;
  featured: Featured;
  /** Whether the polls chose it (else random). */
  voted: { five: boolean; fours: boolean };
  startedAt: number;
}

export type PollKind = "five" | "fours";

/** A banner poll as posted; no message when posting failed (the banner is then random). */
export interface StoredPoll {
  guildId: string;
  /** The week it votes for. */
  week: string;
  kind: PollKind;
  channelId: string | null;
  messageId: string | null;
  /** Driver ids, in answer order. */
  options: string[];
  endsAt: number;
}

/** One pull as stored. */
export interface PullRow {
  id: number;
  banner: BannerKind;
  driverId: string;
  tier: Tier;
  featured: boolean;
  level: number;
  cost: number;
  refund: number;
  at: number;
}
