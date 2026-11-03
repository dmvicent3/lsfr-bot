import type { Game, Step } from "../types.ts";
import { putDigit } from "./put-digit.ts";
import { putNote } from "./put-note.ts";

/** What a digit button does in each mode. */
const PUTS: Record<"notes" | "digits", (g: Game, digit: number) => Step> = {
  notes: putNote,
  digits: putDigit,
};

/** A digit button: places the digit, or in note mode toggles that note. */
export const put = (g: Game, digit: number): Step =>
  PUTS[g.noteMode ? "notes" : "digits"](g, digit);
