export type AskedKind = "question" | "kaos";

export interface ScoreRow {
  guildId: string;
  userId: string;
  sessionId: number;
  kind: "typed" | "button" | "kaos";
  itemId: number;
  points: number;
  ms: number;
  at: number;
}

export interface Standing {
  userId: string;
  points: number;
}

export interface PlayerStats {
  points: number;
  typedWins: number;
  avgTypedMs: number | null;
  bestTypedMs: number | null;
  kaosItems: number;
}

/** The fastest typed answer to one question in one server. */
export interface SpeedRecord {
  guildId: string;
  questionId: number;
  userId: string;
  ms: number;
  at: number;
}

export interface Report {
  guildId: string;
  kind: AskedKind;
  itemId: number;
  userId: string;
  reason: string | null;
  at: number;
}

export interface ButtonPickRow {
  guildId: string;
  userId: string;
  questionId: number;
  right: boolean;
  at: number;
}
