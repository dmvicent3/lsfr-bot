import { type APIMessageTopLevelComponent, ButtonStyle, ComponentType } from "discord.js";
import { SQUARE_NAMES, other } from "./board.ts";
import type { BoardMessage, ButtonRow, GameView, JevosPick, Mark, Outcome } from "./types.ts";

const EMBED_COLOR = 0x5865f2;
const EMOJI: Record<Mark, string> = { X: "❌", O: "⭕" };

const ENDINGS: Record<Exclude<Outcome["kind"], "playing" | "win">, string> = {
  draw: "Draw",
  resigned: "You resigned",
  abandoned: "Abandoned",
};

function status(v: GameView): string {
  if (v.outcome.kind === "win") return v.outcome.winner === "player" ? "You win!" : "jevos wins";

  if (v.outcome.kind !== "playing") return ENDINGS[v.outcome.kind];

  return v.thinking ? "jevos is thinking…" : "Your turn.";
}

function lastMove(p: JevosPick): string {
  if (p.share === null) return `jevos blanked and guessed square ${p.square + 1}`;

  return `jevos took the ${SQUARE_NAMES[p.square]} (${Math.round(p.share * 100)}% sure)`;
}

type Button = ButtonRow["components"][number];

function square(v: GameView, s: number, locked: boolean): Button {
  const cell = v.game.board[s] ?? null;
  const onLine = v.outcome.kind === "win" && v.outcome.line.includes(s);

  return {
    type: ComponentType.Button,
    custom_id: `tictactoe:move:${s + 1}`,
    label: cell ? EMOJI[cell] : String(s + 1),
    style: onLine ? ButtonStyle.Success : ButtonStyle.Secondary,
    disabled: locked || cell !== null,
  };
}

function rows(v: GameView): ButtonRow[] {
  if (v.outcome.kind === "abandoned") return [];

  const locked = v.thinking || v.outcome.kind !== "playing";
  const row = (components: Button[]): ButtonRow => ({ type: ComponentType.ActionRow, components });
  const resign: Button = {
    type: ComponentType.Button,
    custom_id: "tictactoe:resign",
    label: "Resign",
    style: ButtonStyle.Danger,
    disabled: locked,
  };

  return [0, 3, 6]
    .map((r) => row([r, r + 1, r + 2].map((s) => square(v, s, locked))))
    .concat(row([resign]));
}

/** The board message: who plays what, jevos's last move, how the game stands, the buttons. */
export function renderGame(v: GameView): BoardMessage {
  const { game } = v;
  const players = `<@${game.playerId}> ${EMOJI[other(game.jevosMark)]} vs jevos ${EMOJI[game.jevosMark]}`;
  const lines = [players, ...(v.last ? [lastMove(v.last)] : []), status(v)];

  return {
    embeds: [{ title: "Tic-tac-toe", color: EMBED_COLOR, description: lines.join("\n") }],
    components: rows(v),
  };
}

const isButtonRow = (c: APIMessageTopLevelComponent): c is ButtonRow =>
  c.type === ComponentType.ActionRow &&
  c.components.every((b) => b.type === ComponentType.Button && "custom_id" in b);

/** An old board's buttons as they look (a win line stays green), every one disabled. */
export const lockedCopy = (components: readonly APIMessageTopLevelComponent[]): ButtonRow[] =>
  components.filter(isButtonRow).map((r) => ({
    ...r,
    components: r.components.map((b) => ({ ...b, disabled: true })),
  }));
