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
}

/** A driver chosen within a tier, and the guarantee that follows. */
export interface Pick {
  driverId: string;
  featured: boolean;
  lost: boolean;
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

/** What a player's balance is made of. */
export interface Ledger {
  /** Points earned across every game, ever. */
  earned: number;
  /** Given back for copies past C6. */
  refunds: number;
  /** Paid for pulls. */
  spent: number;
}
