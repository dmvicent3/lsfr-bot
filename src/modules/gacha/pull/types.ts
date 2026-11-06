import type { PlayerRef, PointsSource } from "../../../core/points-types.ts";
import type { BannerKind, Featured, Landed, Pity, Pools } from "../engine/types.ts";
import type { GachaRepo } from "../store/repo.ts";

/** What a pull needs that doesn't change between pulls. */
export interface PullDeps {
  repo: GachaRepo;
  sources: readonly PointsSource[];
  pools: Pools;
  random: () => number;
}

/** One /gacha pull. */
export interface PullAsk {
  who: PlayerRef;
  kind: BannerKind;
  count: number;
  price: number;
  /** The current limited banner; null on the standard banner. */
  featured: Featured | null;
  now: number;
}

/** A pull that went through, or the balance that fell short. */
export type PullOutcome =
  | { ok: true; landed: Landed[]; pity: Pity; balance: number; cost: number }
  | { ok: false; balance: number; cost: number };
