import { CARD, fullCard } from "./card.ts";
import { MINI, miniCard } from "./mini.ts";
import { fitSize, place, svgDoc, text } from "./svg.ts";
import { INK, MUTED, PAGE, TIER, tierDefs } from "./theme.ts";
import type { BannerView } from "./types.ts";

const W = 1110;
const H = 600;
const PAD = 36;
const RIGHT = PAD + CARD.w + 40;
const GAP = 18;
const RULES = "50/50: the featured ★5 half the time, always after a miss.";

function words(v: BannerView): string {
  const width = W - RIGHT - PAD;

  return (
    text(v.title, {
      x: RIGHT,
      y: 84,
      size: fitSize(v.title, width, 46, true),
      fill: INK,
      bold: true,
      anchor: "start",
    }) +
    text(v.subtitle, {
      x: RIGHT,
      y: 126,
      size: fitSize(v.subtitle, width, 26),
      fill: TIER[5].accent,
      anchor: "start",
    }) +
    text(RULES, { x: RIGHT, y: 500, size: fitSize(RULES, width, 21), fill: INK, anchor: "start" }) +
    text(v.footer, {
      x: RIGHT,
      y: H - PAD - 4,
      size: fitSize(v.footer, width, 22),
      fill: MUTED,
      anchor: "start",
    })
  );
}

/** The week's limited banner: the featured ★5 large on the left, the three ★4s beside it. */
export function bannerSvg(v: BannerView): string {
  const five = place(fullCard({ driver: v.five, level: null, isNew: false }), {
    x: PAD,
    y: (H - CARD.h) / 2,
  });
  const fours = v.fours.map((driver, i) =>
    place(miniCard({ driver, level: null, isNew: false }), {
      x: RIGHT + i * (MINI.w + GAP),
      y: 168,
    }),
  );
  const glow = `<rect x="${PAD - 10}" y="${(H - CARD.h) / 2 - 10}" width="${CARD.w + 20}" height="${CARD.h + 20}" rx="30" fill="${TIER[5].accent}" fill-opacity="0.18"/>`;

  return svgDoc(
    { width: W, height: H },
    `${tierDefs()}<rect width="${W}" height="${H}" fill="${PAGE}"/>${glow}${five}${fours.join("")}${words(v)}`,
  );
}
