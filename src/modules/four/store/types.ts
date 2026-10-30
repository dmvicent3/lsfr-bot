export interface GameRow {
  guild_id: string;
  player_id: string;
  channel_id: string;
  message_id: string | null;
  /** 42 characters of ".", "R" and "Y", top row first. */
  board: string;
  first: string;
  difficulty: string;
  started_at: number;
  updated_at: number;
}

export type Result = "win" | "loss" | "draw";

export type How = "four" | "full" | "resigned" | "abandoned" | "replaced";

/** How a game ended, as one four_results row records it. */
export interface Finish {
  result: Result;
  how: How;
  endedAt: number;
}

export interface LevelStats {
  wins: number;
  losses: number;
  draws: number;
  /** Fewest player moves in a win; null with no wins. */
  best: number | null;
}

export interface Standing {
  userId: string;
  points: number;
  wins: number;
}
