export interface GameRow {
  guild_id: string;
  date: string;
  user_id: string;
  guesses: string;
  solved: number | null;
  points: number | null;
  streak: number | null;
  started_at: number;
  finished_at: number | null;
}

export interface PracticeRow {
  guild_id: string;
  user_id: string;
  answer: string;
  guesses: string;
  started_at: number;
  finished_at: number | null;
}
