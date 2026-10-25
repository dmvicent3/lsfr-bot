export type Championship = "drivers" | "constructors";

export interface StandingRow {
  pos: string;
  name: string;
  /** Empty for constructors. */
  team: string;
  points: string;
  wins: string;
}

export interface Standings {
  /** The round the standings are after, when the source says. */
  round: number | null;
  rows: StandingRow[];
}
