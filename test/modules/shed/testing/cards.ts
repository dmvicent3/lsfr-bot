import type { Card, Colour, Value } from "../../../../src/modules/shed/game/types.ts";

let next = 1000;

/** A card for a test; ids count up so no two test cards share one. */
export const card = (colour: Colour | null, value: Value): Card => ({
  id: next++,
  colour,
  value,
});
