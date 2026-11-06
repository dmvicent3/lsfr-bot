export const TIERS = [5, 4, 3] as const;

export type Tier = (typeof TIERS)[number];

export type BannerKind = "limited" | "standard";

/** A player's counters on one banner. `five` and `four` count pulls since the last ★5 and ★4. */
export interface Pity {
  five: number;
  four: number;
  /** The next ★5 (limited) is the featured one. */
  guaranteeFive: boolean;
  /** The next ★4 (limited) is a featured one. */
  guaranteeFour: boolean;
}

/** Driver ids by tier. */
export type Pools = Record<Tier, readonly string[]>;

/** A limited banner's featured drivers. */
export interface Featured {
  five: string;
  fours: readonly string[];
}

/** What a pull draws from: the banner kind, its featured drivers (limited) and the pools. */
export interface Draw {
  kind: BannerKind;
  featured: Featured | null;
  pools: Pools;
}

/** One pull's result. */
export interface Roll {
  driverId: string;
  tier: Tier;
  /** A featured driver of a limited banner. */
  featured: boolean;
  /** A lost 50/50: a guarantee is now set. */
  lost: boolean;
  /** Featured because of a guarantee, with no 50/50 rolled. */
  guaranteed: boolean;
  /** Pulls since this tier's last one, counting this one (1 for a ★3, which has no counter). */
  pulls: number;
}

/** A driver chosen within a tier, and the guarantee that follows. */
export interface Pick {
  driverId: string;
  featured: boolean;
  lost: boolean;
  /** Featured because of a guarantee, with no 50/50 rolled. */
  guaranteed: boolean;
  /** The guarantee for this tier after the pick. */
  guarantee: boolean;
}

/** A pull's roll once the copy is counted. */
export interface Landed extends Roll {
  /** The level after this copy (C0–C6). */
  level: number;
  /** The first copy. */
  isNew: boolean;
  /** Given back for a copy past C6; 0 otherwise. */
  refund: number;
}

/** How one limited ★5 50/50 went. */
export type Coin = "won" | "lost";

/** A player's limited ★5 50/50 record. */
export interface FiftyFifty {
  /** The latest result and how many in a row ended that way; null before the first 50/50. */
  current: { coin: Coin; run: number } | null;
  /** The longest run of each result. */
  best: Record<Coin, number>;
  /** How many of each, ever. */
  count: Record<Coin, number>;
}

/** What a player's balance is made of. */
export interface Ledger {
  /** Points earned across every game, ever. */
  earned: number;
  /** Given back for copies past C6. */
  refunds: number;
  /** Paid for pulls. */
  spent: number;
}
