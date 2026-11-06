import type { Chip, ChipKind, ChipMenu, ChipOption, Weekend } from "./types.ts";
import type { Session } from "../types.ts";
import { CHIPS, chipLabel, chipValue, isChipKind } from "./chips.ts";

const MAX_OPTIONS = 25;
const POSITIONS = [0, 1, 2] as const;
const NONE = "none";

/** The options one chip kind adds: Triple Pick one per open session and position. */
function optionsOf(kind: ChipKind, open: readonly Session[]): { chip: Chip; title: string }[] {
  if (kind !== "triple") return [{ chip: { kind, sessionId: null, position: null }, title: "" }];

  return open.flatMap((s) =>
    POSITIONS.map((position) => ({
      chip: { kind, sessionId: s.sessionId, position },
      title: s.title,
    })),
  );
}

/**
 * The chip select: "No chip", then each chip not played on another weekend this season (Triple
 * Pick once per open session × P1–P3), the current one preselected. At most 25.
 */
export function chipOptions(v: {
  used: ReadonlySet<ChipKind>;
  current: Chip | null;
  open: readonly Session[];
}): ChipOption[] {
  const current = v.current ? chipValue(v.current) : NONE;
  const none = { label: "No chip", value: NONE, description: "Save your chips", default: false };
  const chips = Object.keys(CHIPS)
    .filter(isChipKind)
    .filter((kind) => !v.used.has(kind))
    .flatMap((kind) => optionsOf(kind, v.open))
    .map(({ chip, title }) => ({
      label: chipLabel(chip, title),
      value: chipValue(chip),
      description: CHIPS[chip.kind].blurb,
      default: false,
    }));

  return [none, ...chips]
    .slice(0, MAX_OPTIONS)
    .map((o) => ({ ...o, default: o.value === current }));
}

/** "🎯 Triple Pick: Race P1" for the viewer's chip of the weekend; null without one. */
export function weekendChipLabel({ chip, event }: Weekend): string | null {
  if (!chip) return null;

  return chipLabel(chip, event.sessions.find((s) => s.sessionId === chip.sessionId)?.title);
}

/** The picker's chip part: the chip, and its options until the weekend locks. */
export const chipMenu = (weekend: Weekend, used: ReadonlySet<ChipKind>): ChipMenu => ({
  label: weekendChipLabel(weekend),
  options: weekend.locked ? null : chipOptions({ used, current: weekend.chip, open: weekend.open }),
});
