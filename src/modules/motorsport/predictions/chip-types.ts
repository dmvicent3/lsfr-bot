/** The chip types, apart from types.ts to keep it within the size limit. */

export type ChipKind = "double" | "triple" | "safety" | "lateswap";

/** A player's chip for one weekend; Triple Pick also marks one session's position (0 = P1). */
export interface Chip {
  kind: ChipKind;
  sessionId: string | null;
  position: number | null;
}

/** A chip as stored: whose, which weekend. */
export interface PlayedChip {
  userId: string;
  eventId: string;
  chip: Chip;
}

/** A select option of the chip picker. */
export interface ChipOption {
  label: string;
  value: string;
  description: string;
  default: boolean;
}

/** The chip part of an F1 picker: the chip's label, and the options while it can change. */
export interface ChipMenu {
  /** "🎯 Triple Pick: Race P1"; null without a chip. */
  label: string | null;
  /** null once the weekend locked: the chip is frozen. */
  options: ChipOption[] | null;
}
