import {
  type APIActionRowComponent,
  type APIStringSelectComponent,
  ComponentType,
} from "discord.js";
import { clip } from "../../../core/clip.ts";
import { pickId, slotKey } from "./ids.ts";
import { slotLabel } from "./labels.ts";
import type { BoardView } from "./types.ts";

export const OPTIONS_MAX = 25;
const DESCRIPTION_MAX = 100;

export type SelectRow = APIActionRowComponent<APIStringSelectComponent>;

/** `Pick a clue` over every clue, filled or not; value `<n>a|<n>d`. */
export function clueSelect(v: BoardView): SelectRow {
  const { puzzle, clues } = v.stored;
  const options = puzzle.slots.map((s, i) => ({
    label: slotLabel(s),
    value: slotKey(s),
    description: clip(clues[i]!, DESCRIPTION_MAX),
  }));

  if (options.length > OPTIONS_MAX)
    throw new Error(`${options.length} options, max ${OPTIONS_MAX}`);

  const menu: APIStringSelectComponent = {
    type: ComponentType.StringSelect,
    custom_id: pickId(v.scope, v.stamp),
    placeholder: "Pick a clue",
    options,
  };

  return { type: ComponentType.ActionRow, components: [menu] };
}
