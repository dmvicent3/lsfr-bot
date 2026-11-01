import {
  type APIButtonComponentWithCustomId,
  type APIComponentInMessageActionRow,
  ButtonStyle,
  ComponentType,
} from "discord.js";
import { cellName, colOf, rowOf } from "../grid.ts";
import { nextKind } from "../place.ts";
import { type Game, SIZE } from "../types.ts";
import type { Row } from "./types.ts";

type Button = APIButtonComponentWithCustomId;

const row = (components: APIComponentInMessageActionRow[]): Row => ({
  type: ComponentType.ActionRow,
  components,
});

const button = (id: string, label: string, style: Button["style"], disabled = false): Button => ({
  type: ComponentType.Button,
  custom_id: id,
  label,
  style,
  disabled,
});

function menu(id: string, picked: number, label: (n: number) => string): Row {
  const options = Array.from({ length: SIZE }, (_, n) => ({
    label: label(n),
    value: String(n),
    default: n === picked,
  }));

  return row([{ type: ComponentType.StringSelect, custom_id: id, options }]);
}

/** The row and column selects that move the cursor. */
const cursorMenus = (g: Game): Row[] => [
  menu("fleet:row", rowOf(g.cursor), (n) => `Row ${n + 1}`),
  menu("fleet:col", colOf(g.cursor), (n) => `Column ${cellName(n).slice(0, 1)}`),
];

const RESIGN = button("fleet:resign", "Resign", ButtonStyle.Danger);

export function placingControls(g: Game): Row[] {
  const done = nextKind(g.player.ships) === null;
  const facing = (dir: Game["dir"]) =>
    g.dir === dir ? ButtonStyle.Primary : ButtonStyle.Secondary;

  return [
    ...cursorMenus(g),
    row([
      button("fleet:dir:across", "Across", facing("across")),
      button("fleet:dir:down", "Down", facing("down")),
      button("fleet:place", "Place", ButtonStyle.Success, done),
      button("fleet:undo", "Undo", ButtonStyle.Secondary, g.player.ships.length === 0),
      button("fleet:random", done ? "Re-roll" : "Random", ButtonStyle.Secondary),
    ]),
    row([...(done ? [button("fleet:ready", "Ready", ButtonStyle.Success)] : []), RESIGN]),
  ];
}

export const firingControls = (g: Game): Row[] => [
  ...cursorMenus(g),
  row([button("fleet:fire", "Fire", ButtonStyle.Primary), RESIGN]),
];
