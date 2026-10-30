import type { KaosList, Question } from "../types.ts";

/** Points won in a round; KAOS awards name the item. */
export interface Award {
  userId: string;
  points: number;
  ms: number;
  itemIndex?: number;
}

/** A message that may answer the open round. */
export interface Answer {
  userId: string;
  text: string;
  at: number;
}

export interface TypedRound {
  kind: "typed";
  id: string;
  question: Question;
  startedAt: number;
  order: number[];
  level: 0 | 1 | 2;
  award: Award | null;
  closedAt: number | null;
}

export interface Pick {
  userId: string;
  index: number;
  at: number;
}

export interface ButtonRound {
  kind: "button";
  id: string;
  question: Question;
  startedAt: number;
  options: string[];
  right: number;
  picks: Pick[];
  /** Players of the previous round; once all have picked, the round closes early. */
  expected: string[];
  closedAt: number | null;
}

export interface Claim {
  userId: string;
  at: number;
}

export interface KaosRound {
  kind: "kaos";
  id: string;
  list: KaosList;
  startedAt: number;
  claims: (Claim | null)[];
  hinted: boolean;
  closedAt: number | null;
}

export type Round = TypedRound | ButtonRound | KaosRound;
