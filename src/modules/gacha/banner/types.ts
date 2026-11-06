/** A banner week: Monday 00:00 to the next Monday 00:00 in the server's time zone. */
export interface Week {
  /** The Monday, YYYY-MM-DD; the week's key. */
  start: string;
  startsAt: number;
  endsAt: number;
  /** When the polls for the next week go up (Thursday 12:00). */
  pollsAt: number;
}

/** One poll's options (driver ids) and the votes each got, in the same order. */
export interface PollTally {
  options: readonly string[];
  votes: readonly number[];
}

/** The polls for a week, each null when it was never posted or can't be read. */
export interface WeekPolls {
  five: PollTally | null;
  fours: PollTally | null;
}
