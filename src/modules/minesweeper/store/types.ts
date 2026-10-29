export interface GameRow {
  id: number;
  guild_id: string;
  channel_id: string;
  message_id: string | null;
  player_id: string;
  width: number;
  height: number;
  mines: number;
  /** "*" mine / "." safe per cell; null until the first reveal. */
  field: string | null;
  /** "h" hidden / "o" open / "f" flag per cell, row-major. */
  cells: string;
  cursor: number;
  hit: number | null;
  created_at: number;
  started_at: number | null;
  finished_at: number | null;
  result: string | null;
  controls: string;
}

export interface FinishedDbRow {
  width: number;
  height: number;
  mines: number;
  result: string;
  started_at: number;
  finished_at: number;
}
