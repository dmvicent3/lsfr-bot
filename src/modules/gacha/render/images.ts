import { svgToPng } from "../../../core/png.ts";
import type { Landed } from "../engine/types.ts";
import type { Driver } from "../types.ts";
import { bannerSvg } from "./banner.ts";
import { CARD, fullCard } from "./card.ts";
import { svgDoc } from "./svg.ts";
import { tenSvg } from "./ten.ts";
import { tierDefs } from "./theme.ts";
import type { BannerView } from "./types.ts";

/** Single cards are drawn at twice their size so they stay sharp when Discord scales them. */
const CARD_SCALE = 2;

/** One driver's card as an SVG document. */
export const cardSvg = (driver: Driver, l: Pick<Landed, "level" | "isNew">): string =>
  svgDoc(
    {
      width: CARD.w,
      height: CARD.h,
      scale: CARD_SCALE,
    },
    tierDefs() + fullCard({ driver, level: l.level, isNew: l.isNew }),
  );

export const cardPng = (driver: Driver, l: Pick<Landed, "level" | "isNew">): Buffer =>
  svgToPng(cardSvg(driver, l));

export const tenPng = (cards: Parameters<typeof tenSvg>[0]): Buffer => svgToPng(tenSvg(cards));

export const bannerPng = (v: BannerView): Buffer => svgToPng(bannerSvg(v));
