import {
  type APIActionRowComponent,
  type APIButtonComponentWithCustomId,
  ButtonStyle,
  ComponentType,
} from "discord.js";
import { flag } from "../../../core/countries/flag.ts";
import { cellId } from "./labels.ts";

type Row = APIActionRowComponent<APIButtonComponentWithCustomId>;

const LABEL_MAX = 80;

const button = (
  custom_id: string,
  label: string,
  style: APIButtonComponentWithCustomId["style"],
): APIButtonComponentWithCustomId => ({ type: ComponentType.Button, custom_id, label, style });

const row = (components: APIButtonComponentWithCustomId[]): Row => ({
  type: ComponentType.ActionRow,
  components,
});

function cellButton(scope: string, cells: string[], names: Map<string, string>, i: number) {
  const iso2 = cells[i]!;
  const id = `grid:cell:${scope}:${i}`;

  if (!iso2) return button(id, cellId(i), ButtonStyle.Secondary);

  const label = `${flag(iso2)} ${names.get(iso2) ?? iso2}`.slice(0, LABEL_MAX);

  return button(id, label, ButtonStyle.Success);
}

/** The 3×3 cell buttons; none once the game is done. `names` maps iso2 to country name. */
export function cellButtons(
  scope: string,
  cells: string[],
  names: Map<string, string>,
  done: boolean,
): Row[] {
  if (done) return [];

  return [0, 3, 6].map((r) => row([0, 1, 2].map((c) => cellButton(scope, cells, names, r + c))));
}

/** Give up while playing, New for a practice grid; a finished daily has none. */
export function controlRow(scope: string, practice: boolean, done: boolean): Row[] {
  const give = button(`grid:giveup:${scope}`, "Give up", ButtonStyle.Danger);
  const fresh = button("grid:new", "New", ButtonStyle.Success);
  const parts = [...(done ? [] : [give]), ...(practice ? [fresh] : [])];

  return parts.length > 0 ? [row(parts)] : [];
}
