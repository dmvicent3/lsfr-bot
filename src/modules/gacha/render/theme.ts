import type { Tier } from "../engine/types.ts";
import type { Colours } from "./types.ts";

/** Tier colours: gold for champions, violet for race winners, blue for everyone else. */
export const TIER: Record<Tier, Colours> = {
  5: { light: "#ffd66e", dark: "#9a5b06", accent: "#ffc93c" },
  4: { light: "#cfa6ff", dark: "#53239a", accent: "#b98cff" },
  3: { light: "#9cc8f5", dark: "#28588f", accent: "#86b9ef" },
};

export const INK = "#f4f5f7";
export const MUTED = "#a3abb9";
export const PANEL = "#14161b";
export const CHIP = "#262a33";
export const PAGE = "#0d0e12";

/** The gradients every card refers to, by tier: url(#tier5) and so on. */
export const tierDefs = (): string =>
  `<defs>${([5, 4, 3] as const)
    .map(
      (t) =>
        `<linearGradient id="tier${t}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${TIER[t].light}"/><stop offset="1" stop-color="${TIER[t].dark}"/></linearGradient>`,
    )
    .join("")}</defs>`;

export const stars = (tier: Tier): string => "★".repeat(tier);
