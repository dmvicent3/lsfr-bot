import {
  type APIActionRowComponent,
  type APIButtonComponentWithCustomId,
  type APIComponentInMessageActionRow,
  type APISelectMenuOption,
  ButtonStyle,
  ComponentType,
} from "discord.js";
import { canStep } from "../cursor.ts";
import type { Direction, Game } from "../types.ts";

export type Row = APIActionRowComponent<APIComponentInMessageActionRow>;

type Button = APIButtonComponentWithCustomId;

export const row = (components: APIComponentInMessageActionRow[]): Row => ({
  type: ComponentType.ActionRow,
  components,
});

export const options = (count: number, picked: number, label: (n: number) => string) =>
  Array.from({ length: count }, (_, n): APISelectMenuOption => ({
    label: label(n),
    value: String(n),
    default: n === picked,
  }));

export const menu = (customId: string, placeholder: string, opts: APISelectMenuOption[]): Row =>
  row([{ type: ComponentType.StringSelect, custom_id: customId, placeholder, options: opts }]);

export const button = (customId: string, label: string, style: Button["style"]): Button => ({
  type: ComponentType.Button,
  custom_id: customId,
  label,
  style,
});

const ARROWS: Record<Direction, string> = { up: "▲", down: "▼", left: "◀", right: "▶" };

/** An arrow button; greyed out where a step would leave the board. */
export const arrow = (game: Game, dir: Direction): Button => ({
  ...button(`minesweeper:move:${dir}`, ARROWS[dir], ButtonStyle.Secondary),
  disabled: !canStep(game, dir),
});

/** A disabled filler for a game-pad corner (Discord rows can't leave a gap). */
export const blank = (n: number): Button => ({
  ...button(`minesweeper:blank:${n}`, "·", ButtonStyle.Secondary),
  disabled: true,
});

export const REVEAL = button("minesweeper:reveal", "Reveal", ButtonStyle.Primary);

export const FLAG = button("minesweeper:flag", "Flag", ButtonStyle.Secondary);

export const GIVE_UP = button("minesweeper:giveup", "Give up", ButtonStyle.Danger);
