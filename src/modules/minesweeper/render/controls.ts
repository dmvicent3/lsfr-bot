import {
  type APIActionRowComponent,
  type APIButtonComponentWithCustomId,
  type APIComponentInMessageActionRow,
  type APISelectMenuOption,
  ButtonStyle,
  ComponentType,
} from "discord.js";
import { colOf, columnLetter, rowOf } from "../grid.ts";
import type { Game } from "../types.ts";

type Row = APIActionRowComponent<APIComponentInMessageActionRow>;

const options = (count: number, picked: number, label: (n: number) => string) =>
  Array.from({ length: count }, (_, n): APISelectMenuOption => ({
    label: label(n),
    value: String(n),
    default: n === picked,
  }));

const menu = (customId: string, placeholder: string, opts: APISelectMenuOption[]): Row => ({
  type: ComponentType.ActionRow,
  components: [
    { type: ComponentType.StringSelect, custom_id: customId, placeholder, options: opts },
  ],
});

const button = (
  customId: string,
  label: string,
  style: APIButtonComponentWithCustomId["style"],
): APIButtonComponentWithCustomId => ({
  type: ComponentType.Button,
  custom_id: customId,
  label,
  style,
});

/** Column and row menus that move the cursor, then Reveal, Flag and Give up. */
export function controls(game: Game): Row[] {
  const col = colOf(game.cursor, game.width);
  const row = rowOf(game.cursor, game.width);

  return [
    menu("minesweeper:col", "Column", options(game.width, col, columnLetter)),
    menu(
      "minesweeper:row",
      "Row",
      options(game.height, row, (n) => String(n + 1)),
    ),
    {
      type: ComponentType.ActionRow,
      components: [
        button("minesweeper:reveal", "Reveal", ButtonStyle.Primary),
        button("minesweeper:flag", "Flag", ButtonStyle.Secondary),
        button("minesweeper:giveup", "Give up", ButtonStyle.Danger),
      ],
    },
  ];
}
