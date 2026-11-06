import type { Chip, ChipKind, PickScores } from "./types.ts";
import type { ResultKind } from "../results/types.ts";

/** Each chip's face, in the order the picker lists them. */
export const CHIPS: Record<ChipKind, { icon: string; name: string; blurb: string }> = {
  double: { icon: "⏫", name: "Double Weekend", blurb: "Every session's points ×2" },
  triple: { icon: "🎯", name: "Triple Pick", blurb: "This pick scores ×3" },
  safety: { icon: "🛡️", name: "Safety Net", blurb: "Each session you enter scores at least 5" },
  lateswap: {
    icon: "🔁",
    name: "Late Swap",
    blurb: "Change your race picks after the lock, until the race starts",
  },
};

export const isChipKind = (value: string): value is ChipKind => Object.hasOwn(CHIPS, value);

const SAFETY_FLOOR = 5;
const POSITIONS = 3;

/** "double", or "triple:race:0" for Triple Pick on the race's P1. */
export const chipValue = (c: Chip): string =>
  c.kind === "triple" ? `triple:${c.sessionId}:${c.position}` : c.kind;

/** A chip select value back to a chip; "none" and anything malformed are null. */
export function parseChip(value: string): Chip | null {
  const [kind = "", sessionId, position] = value.split(":");

  if (!isChipKind(kind)) return null;

  if (kind !== "triple") return { kind, sessionId: null, position: null };

  const index = Number(position);

  if (!sessionId || !Number.isInteger(index) || index < 0 || index >= POSITIONS) return null;

  return { kind, sessionId, position: index };
}

/** "🎯 Triple Pick: Race P1"; `title` names the marked session. */
export function chipLabel(c: Chip, title = ""): string {
  const { icon, name } = CHIPS[c.kind];
  const mark = c.position === null ? "" : `${title ? `: ${title}` : ""} P${c.position + 1}`;

  return `${icon} ${name}${mark}`;
}

/** Where a chip changes a session: Triple only its marked one, Late Swap only the race. */
export function chipApplies(c: Chip, sessionId: string, kind: ResultKind): boolean {
  const APPLIES: Record<ChipKind, () => boolean> = {
    double: () => true,
    safety: () => true,
    triple: () => c.sessionId === sessionId,
    lateswap: () => kind === "race",
  };

  return APPLIES[c.kind]();
}

type Step = (points: number, s: PickScores, c: Chip) => number;

/** Each chip's effect on a session's points; Late Swap changes when, not how much. */
const STEPS: Record<ChipKind, Step> = {
  triple: (points, s, c) => points + 2 * (s.each[c.position ?? -1] ?? 0),
  safety: (points) => Math.max(points, SAFETY_FLOOR),
  double: (points) => points * 2,
  lateswap: (points) => points,
};

/** Triple first (per pick, not the bonus), then the Safety Net floor, then Double. */
const ORDER: readonly ChipKind[] = ["triple", "safety", "double", "lateswap"];

/** A session's points after the chips that apply to it. */
export function chipPoints(s: PickScores, chips: readonly Chip[]): number {
  const base = s.each.reduce((a, b) => a + b, 0) + s.bonus;

  return ORDER.flatMap((kind) => chips.filter((c) => c.kind === kind)).reduce(
    (points, c) => STEPS[c.kind](points, s, c),
    base,
  );
}
