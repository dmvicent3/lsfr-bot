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

/** Primary while noting, so the mode shows on the buttons it changes. */
const modeStyle = (g: Game) => (g.noteMode ? ButtonStyle.Primary : ButtonStyle.Secondary);

const digits = (g: Game, from: number, to: number): APIButtonComponentWithCustomId[] =>
  Array.from({ length: to - from + 1 }, (_, i) =>
    button(`sudoku:put:${from + i}:${suffix(g)}`, `${from + i}`, modeStyle(g)),
  );

const newButton = (s: string) => button(`sudoku:new:${s}`, "New", ButtonStyle.Success);

/**
 * Move and clear, the digits, check, and the Notes toggle with Undo (and New for practice).
 * Once solved only a practice board keeps New; a solved daily has none.
 */
export function buttons(g: Game): Row[] {
  const s = suffix(g);
  const fresh = g.kind === "practice" ? [newButton(s)] : [];

  if (g.solvedAt !== null) return fresh.length ? [row(fresh)] : [];

  const moves = MOVES.map(([d, label]) => button(`sudoku:move:${d}:${s}`, label));
  const check = button(`sudoku:check:${s}`, "Check", ButtonStyle.Primary);

  /** Discord caps an action row at five components, so Notes, Undo and New get a row of their own. */
  return [
    row([...moves, button(`sudoku:clear:${s}`, "Clear")]),
    row(digits(g, 1, 5)),
    row([...digits(g, 6, 9), check]),
    row([
      button(`sudoku:mode:${s}`, "✏️ Notes", modeStyle(g)),
      button(`sudoku:undo:${s}`, "↩ Undo"),
      ...fresh,
    ]),
  ];
}
