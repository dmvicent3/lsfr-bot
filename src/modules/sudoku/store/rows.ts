import type { Game } from "../types.ts";
import type { GameRow } from "./types.ts";

export const toGame = (r: GameRow): Game => ({
  guildId: r.guild_id,
  userId: r.user_id,
  kind: r.kind,
  date: r.date,
  slot: r.slot,
  level: r.level,
  givens: r.givens,
  solution: r.solution,
  cells: r.cells,
  wrong: r.wrong,
  cursor: r.cursor,
  checks: r.checks,
  startedAt: r.started_at,
  solvedAt: r.solved_at,
  points: r.points,
  streak: r.streak,
  notes: r.notes,
  noteMode: r.note_mode === 1,
  history: r.history,
});

export const COLUMNS =
  "guild_id, user_id, kind, date, slot, level, givens, solution, cells, wrong, cursor, checks, started_at, solved_at, points, streak, notes, note_mode, history";
export const MARKS = "?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?";
export const SOLVED =
  "SELECT * FROM sudoku_games WHERE guild_id = ? AND kind = 'daily' AND solved_at IS NOT NULL";
export const KEY = "guild_id = ? AND user_id = ? AND kind = ? AND date = ? AND slot = ?";

export const values = (g: Game) => [
  g.guildId,
  g.userId,
  g.kind,
  g.date,
  g.slot,
  g.level,
  g.givens,
  g.solution,
  g.cells,
  g.wrong,
  g.cursor,
  g.checks,
  g.startedAt,
  g.solvedAt,
  g.points,
  g.streak,
  g.notes,
  g.noteMode ? 1 : 0,
  g.history,
];
