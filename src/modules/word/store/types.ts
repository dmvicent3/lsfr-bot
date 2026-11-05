export interface PuzzleRow {
  guild_id: string;
  date: string;
  word: string;
  length: number;
}

export interface GameRow {
  guild_id: string;
  date: string;
  user_id: string;
  /** Comma-separated, in order. */
  guesses: string;
  won: number | null;
  points: number | null;
  streak: number | null;
  finished_at: number | null;
}

export interface MultiPuzzleRow {
  guild_id: string;
  mode: string;
  date: string;
  /** Comma-separated, board order. */
  words: string;
  length: number;
}

export interface MultiGameRow extends GameRow {
  mode: string;
  found: number | null;
}
