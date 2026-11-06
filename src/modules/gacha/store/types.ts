import type { BannerKind, Landed } from "../engine/types.ts";

/** One pull command's rolls, as stored: each row costs `price`. */
export interface NewPulls {
  banner: BannerKind;
  landed: readonly Landed[];
  price: number;
  now: number;
}
