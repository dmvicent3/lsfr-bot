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

const HALF = SIZE / 2;

/** One axis as two rows of five buttons, `fleet:<axis>:<n>`; the picked one lit. */
function axisRows(axis: "row" | "col", picked: number, label: (n: number) => string): Row[] {
  const key = (n: number) =>
    button(
      `fleet:${axis}:${n}`,
      label(n),
      n === picked ? ButtonStyle.Primary : ButtonStyle.Secondary,
    );
  const half = (from: number) => row(Array.from({ length: HALF }, (_, k) => key(from + k)));

  return [half(0), half(HALF)];
}

/** The cursor's controls: letters A–J (columns), then numbers 1–10 (rows). */
const cursorButtons = (g: Game): Row[] => [
  ...axisRows("col", colOf(g.cursor), (n) => cellName(n).slice(0, 1)),
  ...axisRows("row", rowOf(g.cursor), (n) => String(n + 1)),
];

const RESIGN = button("fleet:resign", "Resign", ButtonStyle.Danger);

export function placingControls(g: Game): Row[] {
  const done = nextKind(g.player.ships) === null;
  const facing = (dir: Game["dir"]) =>
    g.dir === dir ? ButtonStyle.Primary : ButtonStyle.Secondary;

  return [
    ...cursorButtons(g),
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
  ...cursorButtons(g),
  row([button("fleet:fire", "Fire", ButtonStyle.Primary), RESIGN]),
];
