/** A day's map: the mines, the pre-opened cell and everything it opens. */
export interface DailyMap {
  field: boolean[];
  opening: number;
  open: number[];
}

/** A finished daily's points and how they add up ("Expert: 150", "14 extra clicks: −14"). */
export interface Award {
  points: number;
  parts: string[];
}

/** A player's line on the daily leaderboard. */
export interface Standing {
  userId: string;
  points: number;
  wins: number;
}

/** A player's daily record. */
export interface DailyStats {
  played: number;
  won: number;
  streak: number;
  bestStreak: number;
  points: number;
  /** Best 3BV ÷ clicks on a win, as a whole percent; null before a win. */
  bestEfficiency: number | null;
}
