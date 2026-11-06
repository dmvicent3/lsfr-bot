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
