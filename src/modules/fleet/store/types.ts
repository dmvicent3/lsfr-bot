import type { Difficulty } from "../types.ts";

export interface GameRow {
  guild_id: string;
  player_id: string;
  channel_id: string;
  message_id: string | null;
  difficulty: string;
  /** JSON: phase, first, both sides, cursor and direction. */
  state: string;
  started_at: number;
  updated_at: number;
}

export type How = "sunk" | "resigned" | "abandoned";

/** How a game ended, as one fleet_results row records it. */
export interface Finish {
  result: "win" | "loss";
  how: How;
  endedAt: number;
}

export interface LevelStats {
  wins: number;
  losses: number;
  /** Fewest shots in a win; null with no wins. */
  best: number | null;
}

export interface FleetStats {
  levels: Record<Difficulty, LevelStats>;
  shots: number;
  hits: number;
  resigned: number;
  abandoned: number;
}

export interface Standing {
  userId: string;
  points: number;
  wins: number;
}
