import type { Driver } from "../types.ts";

export interface TextStyle {
  x: number;
  y: number;
  size: number;
  fill: string;
  bold?: boolean;
  anchor?: "start" | "middle" | "end";
}

/** A driver as one card shows them. */
export interface CardView {
  driver: Driver;
  /** Constellation level, C0–C6; null where the card shows no level (the banner). */
  level: number | null;
  isNew: boolean;
  /** Drawn with a white frame and a "BEST" tag. */
  best?: boolean;
}

export interface Colours {
  light: string;
  dark: string;
  accent: string;
}

/** A banner announcement: the featured drivers and three lines of text. */
export interface BannerView {
  five: Driver;
  fours: readonly Driver[];
  title: string;
  /** Under the title, e.g. the week. */
  subtitle: string;
  /** At the bottom, e.g. when it ends. */
  footer: string;
}
