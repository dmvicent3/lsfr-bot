import type { SQLQueryBindings } from "bun:sqlite";
import type {
  CellState,
  Controls,
  FinishedRow,
  Game,
  Kind,
  NewGame,
  Preset,
  Result,
} from "../types.ts";
import type { FinishedDbRow, GameRow } from "./types.ts";

const CELLS: Record<string, CellState> = { h: "hidden", o: "open", f: "flag" };

const CODES: Record<CellState, string> = { hidden: "h", open: "o", flag: "f" };

const RESULTS: Record<string, Result> = { won: "won", lost: "lost", "gave-up": "gave-up" };

const CONTROLS: Record<string, Controls> = { menus: "menus", arrows: "arrows", both: "both" };

const KINDS: Record<string, Kind> = { practice: "practice", daily: "daily" };

const LEVELS: Record<string, Preset> = {
  beginner: "beginner",
  intermediate: "intermediate",
  expert: "expert",
};

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
  controls: CONTROLS[r.controls] ?? "menus",
  kind: KINDS[r.kind] ?? "practice",
  date: r.date,
  level: LEVELS[r.level ?? ""] ?? null,
  clicks: r.clicks,
  bbbv: r.bbbv,
  points: r.points,
  streak: r.streak,
});

export const toFinished = (r: FinishedDbRow): FinishedRow => ({
  width: r.width,
  height: r.height,
  mines: r.mines,
  result: toResult(r.result) ?? "lost",
  startedAt: r.started_at,
  finishedAt: r.finished_at,
});

/** A new game's values in the INSERT's column order. */
export const insertValues = (g: NewGame): SQLQueryBindings[] => [
  g.guildId,
  g.channelId,
  g.messageId,
  g.playerId,
  g.width,
  g.height,
  g.mines,
  fieldText(g.field),
  cellsText(g.cells),
  g.cursor,
  g.hit,
  g.createdAt,
  g.startedAt,
  g.finishedAt,
  g.result,
  g.controls,
  g.kind,
  g.date,
  g.level,
  g.clicks,
  g.bbbv,
  g.points,
  g.streak,
];
