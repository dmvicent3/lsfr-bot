import type { CellState, FinishedRow, Game, Result } from "../types.ts";
import type { FinishedDbRow, GameRow } from "./types.ts";

const CELLS: Record<string, CellState> = { h: "hidden", o: "open", f: "flag" };

const CODES: Record<CellState, string> = { hidden: "h", open: "o", flag: "f" };

const RESULTS: Record<string, Result> = { won: "won", lost: "lost", "gave-up": "gave-up" };

const toResult = (text: string | null): Result | null => RESULTS[text ?? ""] ?? null;

export const fieldText = (field: boolean[] | null): string | null =>
  field ? field.map((m) => (m ? "*" : ".")).join("") : null;

export const cellsText = (cells: CellState[]): string => cells.map((c) => CODES[c]).join("");

export const toGame = (r: GameRow): Game => ({
  id: r.id,
  guildId: r.guild_id,
  channelId: r.channel_id,
  messageId: r.message_id,
  playerId: r.player_id,
  width: r.width,
  height: r.height,
  mines: r.mines,
  field: r.field === null ? null : r.field.split("").map((c) => c === "*"),
  cells: r.cells.split("").map((c) => CELLS[c] ?? "hidden"),
  cursor: r.cursor,
  hit: r.hit,
  result: toResult(r.result),
  createdAt: r.created_at,
  startedAt: r.started_at,
  finishedAt: r.finished_at,
});

export const toFinished = (r: FinishedDbRow): FinishedRow => ({
  width: r.width,
  height: r.height,
  mines: r.mines,
  result: toResult(r.result) ?? "lost",
  startedAt: r.started_at,
  finishedAt: r.finished_at,
});
