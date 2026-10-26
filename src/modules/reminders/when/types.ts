/** A parsed `when`: the instant, or the text to show the member. */
export type When = { at: number } | { error: string };

export interface Clock {
  h: number;
  min: number;
}

/** Today's date in the reminder time zone, with what parsing needs alongside it. */
export interface Today {
  y: number;
  m: number;
  d: number;
  /** 0 = Sunday. */
  weekday: number;
  now: number;
  tz: string;
}
