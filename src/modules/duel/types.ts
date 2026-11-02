export type StatId =
  | "population"
  | "area"
  | "density"
  | "gdp_pc"
  | "life_exp"
  | "urban"
  | "forest"
  | "arable"
  | "co2_pc"
  | "internet"
  | "fertility"
  | "tourists"
  | "aged_65"
  | "peak";

export type Unit = "int" | "km2" | "per_km2" | "usd" | "years" | "pct" | "t" | "dp2" | "m";

export interface StatDef {
  id: StatId;
  label: string;
  unit: Unit;
  source: { wb: string } | { wikidata: "peak" };
  exclude: readonly string[];
}

export interface Reading {
  value: number;
  year: number;
}

export interface Country {
  iso2: string;
  name: string;
  values: Partial<Record<StatId, Reading>>;
}

export interface Snapshot {
  builtAt: string;
  countries: Country[];
}

export interface Side {
  iso2: string;
  name: string;
  value: number;
  year: number;
}

export interface Question {
  stat: StatId;
  a: Side;
  b: Side;
  higher: "a" | "b";
}

export interface Award {
  points: number;
  parts: string[];
}

export interface Puzzle {
  guildId: string;
  date: string;
  questions: Question[];
}

export interface Game {
  guildId: string;
  date: string;
  userId: string;
  answers: string;
  correct: number | null;
  points: number | null;
  streak: number | null;
  startedAt: number;
  finishedAt: number | null;
}

export type { Period } from "../../core/types.ts";

export interface Standing {
  userId: string;
  points: number;
  correct: number;
  lastFinishedAt: number;
}

export interface PlayerStats {
  points: number;
  days: number;
  avgCorrect: number | null;
  perfect: number;
  currentStreak: number;
  longestStreak: number;
}
