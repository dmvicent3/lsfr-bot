/** The progress columns both round tables share. */
export interface ProgressRow {
  word_order: string;
  picked: string;
  found: string;
  guesses: string;
  mistakes: number;
  last_line: string | null;
}

export interface GameRow extends ProgressRow {
  guild_id: string;
  date: string;
  user_id: string;
  solved: number | null;
  points: number | null;
  streak: number | null;
  started_at: number;
  finished_at: number | null;
}

export interface PracticeRow extends ProgressRow {
  guild_id: string;
  user_id: string;
  puzzle: string;
  started_at: number;
  finished_at: number | null;
}
