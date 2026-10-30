import { type APIMessageTopLevelComponent, ButtonStyle, ComponentType } from "discord.js";
import { landingRow } from "../board.ts";
import { playerMoves } from "../game.ts";
import {
  type BoardMessage,
  type ButtonRow,
  COLS,
  type GameView,
  type Outcome,
  ROWS,
} from "../types.ts";

export const TITLE = "🔴 Four in a row";

const EMBED_COLOR = 0xdd2e44;
const DISC = { R: "🔴", Y: "🟡" } as const;
const LINE = { R: "🟥", Y: "🟨" } as const;
const NUMBERS = "1️⃣2️⃣3️⃣4️⃣5️⃣6️⃣7️⃣";

const ENDINGS: Record<Exclude<Outcome["kind"], "playing" | "win">, string> = {
  draw: "Draw — the board is full.",
  resigned: "You resigned.",
  abandoned: "Abandoned.",
};

function status(v: GameView): string {
  if (v.outcome.kind === "win") {
    return v.outcome.winner === "player"
      ? `You win in ${playerMoves(v.game)} moves!`
      : "jevos wins.";
  }

  if (v.outcome.kind !== "playing") return ENDINGS[v.outcome.kind];

  return v.thinking ? "jevos is thinking…" : "Your move.";
}

function grid(v: GameView): string[] {
  const line = v.outcome.kind === "win" ? v.outcome.line : [];

  const cell = (i: number): string => {
    const d = v.game.board[i] ?? null;

    if (!d) return "⚪";

    return line.includes(i) ? LINE[d] : DISC[d];
  };

  return Array.from({ length: ROWS }, (_r, r) =>
    Array.from({ length: COLS }, (_c, c) => cell(r * COLS + c)).join(""),
  );
}

type Button = ButtonRow["components"][number];

const button = (id: string, label: string, style: Button["style"], disabled: boolean): Button => ({
  type: ComponentType.Button,
  custom_id: id,
  label,
  style,
  disabled,
});

const row = (components: Button[]): ButtonRow => ({ type: ComponentType.ActionRow, components });

function rows(v: GameView): ButtonRow[] {
  if (v.outcome.kind === "abandoned") return [];

  const locked = v.thinking || v.outcome.kind !== "playing";
  const column = (c: number): Button =>
    button(
      `four:drop:${c + 1}`,
      String(c + 1),
      ButtonStyle.Primary,
      locked || landingRow(v.game.board, c) === null,
    );
  const resign = button("four:resign", "Resign", ButtonStyle.Secondary, locked);

  return [row([0, 1, 2, 3, 4].map(column)), row([column(5), column(6), resign])];
}

const lastMove = (v: GameView): string[] => {
  if (!v.last) return [];

  return [`jevos ${v.last.share === null ? "guessed" : "played"} column ${v.last.col + 1}`];
};

/** The board message: who plays what, the grid, jevos's last drop, how the game stands. */
export function renderGame(v: GameView): BoardMessage {
  const players = `<@${v.game.playerId}> ${DISC.R} vs jevos ${DISC.Y}`;
  const lines = [players, "", ...grid(v), NUMBERS, "", ...lastMove(v), status(v)];
  const title = `Four in a row — ${v.game.difficulty}`;

  return {
    embeds: [{ title, color: EMBED_COLOR, description: lines.join("\n") }],
    components: rows(v),
  };
}

const isButtonRow = (c: APIMessageTopLevelComponent): c is ButtonRow =>
  c.type === ComponentType.ActionRow &&
  c.components.every((b) => b.type === ComponentType.Button && "custom_id" in b);

/** An old board's buttons as they look, every one disabled. */
export const lockedCopy = (components: readonly APIMessageTopLevelComponent[]): ButtonRow[] =>
  components.filter(isButtonRow).map((r) => ({
    ...r,
    components: r.components.map((b) => ({ ...b, disabled: true })),
  }));
