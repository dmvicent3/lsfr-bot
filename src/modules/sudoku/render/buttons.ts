import {
  type APIActionRowComponent,
  type APIButtonComponentWithCustomId,
  ButtonStyle,
  ComponentType,
} from "discord.js";
import type { Game } from "../types.ts";

type Row = APIActionRowComponent<APIButtonComponentWithCustomId>;

const MOVES: [string, string][] = [
  ["left", "◀"],
  ["up", "▲"],
  ["down", "▼"],
  ["right", "▶"],
];

/** Daily games are found again by date and level; a practice game is the player's one. */
const suffix = (g: Game): string =>
  g.kind === "daily" ? `daily:${g.date}:${g.level}` : "practice";

const button = (
  id: string,
  label: string,
  style: APIButtonComponentWithCustomId["style"] = ButtonStyle.Secondary,
): APIButtonComponentWithCustomId => ({
  type: ComponentType.Button,
  custom_id: id,
  label,
  style,
});

const row = (components: APIButtonComponentWithCustomId[]): Row => ({
  type: ComponentType.ActionRow,
  components,
});

const digits = (from: number, to: number, s: string): APIButtonComponentWithCustomId[] =>
  Array.from({ length: to - from + 1 }, (_, i) =>
    button(`sudoku:put:${from + i}:${s}`, `${from + i}`),
  );

/** Move and clear, the digits, and check (plus new for practice); none once solved. */
export function buttons(g: Game): Row[] {
  if (g.solvedAt !== null) return [];

  const s = suffix(g);
  const moves = MOVES.map(([d, label]) => button(`sudoku:move:${d}:${s}`, label));
  const last = [...digits(6, 9, s), button(`sudoku:check:${s}`, "Check", ButtonStyle.Primary)];

  if (g.kind === "practice") last.push(button(`sudoku:new:${s}`, "New", ButtonStyle.Success));

  return [row([...moves, button(`sudoku:clear:${s}`, "Clear")]), row(digits(1, 5, s)), row(last)];
}
