import { MINI, miniCard } from "./mini.ts";
import { place, svgDoc, text } from "./svg.ts";
import { INK, PAGE, TIER, stars, tierDefs } from "./theme.ts";
import type { CardView } from "./types.ts";

const PAD = 24;
const GAP = 16;
const TOP = 72;
const COLS = 5;

/** "1 × ★5 · 2 × ★4 · 7 × ★3" for the header. */
function tally(cards: readonly CardView[]): string {
  return ([5, 4, 3] as const)
    .map((t) => [t, cards.filter((c) => c.driver.tier === t).length] as const)
    .filter(([, n]) => n > 0)
    .map(([t, n]) => `${n} × ${stars(t)}`)
    .join("   ");
}

/** The cards of a multi-pull in a 5-wide grid, in the order given (show order: best first). */
export function tenSvg(cards: readonly CardView[]): string {
  const rows = Math.ceil(cards.length / COLS);
  const width = PAD * 2 + COLS * MINI.w + (COLS - 1) * GAP;
  const height = TOP + rows * MINI.h + (rows - 1) * GAP + PAD;
  const best = cards[0]?.driver.tier ?? 3;
  const head =
    text(`${cards.length} pulls`, {
      x: PAD,
      y: 48,
      size: 32,
      fill: INK,
      bold: true,
      anchor: "start",
    }) +
    text(tally(cards), { x: width - PAD, y: 48, size: 26, fill: TIER[best].accent, anchor: "end" });
  const grid = cards.map((c, i) => {
    const x = PAD + (i % COLS) * (MINI.w + GAP);
    const y = TOP + Math.floor(i / COLS) * (MINI.h + GAP);

    return place(miniCard(c), { x, y });
  });

  return svgDoc(
    { width, height },
    `${tierDefs()}<rect width="${width}" height="${height}" fill="${PAGE}"/>${head}${grid.join("")}`,
  );
}
