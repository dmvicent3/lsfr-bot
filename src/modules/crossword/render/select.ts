import {
  type APIActionRowComponent,
  type APIStringSelectComponent,
  ComponentType,
} from "discord.js";
import { clip } from "../../../core/clip.ts";
import { pickId, slotKey } from "./ids.ts";
import { DIR_NAME, slotLabel } from "./labels.ts";
import type { Dir } from "../types.ts";
import type { BoardView } from "./types.ts";

export const OPTIONS_MAX = 25;
const DESCRIPTION_MAX = 100;

export type SelectRow = APIActionRowComponent<APIStringSelectComponent>;

/** What a select offers: the slots (indices) and the prompt; `empty` stands in when there are none. */
interface Offer {
  at: number[];
  placeholder: string;
  empty: string;
}

const row = (menu: APIStringSelectComponent): SelectRow => ({
  type: ComponentType.ActionRow,
  components: [menu],
});

/** A select of the given clues, value `<n>a|<n>d`; with none, a disabled one saying so. */
export function clueSelect(v: BoardView, offer: Offer): SelectRow {
  const { puzzle, clues } = v.stored;
  const options = offer.at.map((i) => ({
    label: slotLabel(puzzle.slots[i]!),
    value: slotKey(puzzle.slots[i]!),
    description: clip(clues[i]!, DESCRIPTION_MAX),
  }));

  if (options.length > OPTIONS_MAX)
    throw new Error(`${options.length} options, max ${OPTIONS_MAX}`);

  const custom_id = pickId(v.scope, v.stamp, v.menu);

  if (options.length === 0) {
    const none = [{ label: offer.empty, value: "none" }];
    const placeholder = offer.empty;

    return row({
      type: ComponentType.StringSelect,
      custom_id,
      placeholder,
      options: none,
      disabled: true,
    });
  }

  return row({
    type: ComponentType.StringSelect,
    custom_id,
    placeholder: offer.placeholder,
    options,
  });
}

/** `Pick a clue` over every clue, filled or not (5×5 and 7×7). */
export const allClues = (v: BoardView): SelectRow =>
  clueSelect(v, {
    at: v.stored.puzzle.slots.map((_, i) => i),
    placeholder: "Pick a clue",
    empty: "No clues",
  });

const ARTICLE: Record<Dir, string> = { a: "an", d: "a" };

/** `Pick an Across clue` over one page of a paged board's open clues. */
export function pageClues(v: BoardView, at: number[]): SelectRow {
  const dir = v.menu?.dir ?? "a";
  const name = DIR_NAME[dir];

  return clueSelect(v, {
    at,
    placeholder: `Pick ${ARTICLE[dir]} ${name} clue`,
    empty: `Every ${name} clue is solved`,
  });
}
