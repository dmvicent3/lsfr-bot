import type { Country } from "../../core/countries/types.ts";

export type RuleKind = "geo" | "flag" | "stat" | "politics";

export const RULE_ID_LIST = [
  "africa",
  "asia",
  "europe",
  "north_america",
  "south_america",
  "oceania",
  "landlocked",
  "island",
  "borders_4",
  "borders_0_1",
  "letter_a",
  "letter_b",
  "letter_s",
  "letter_m",
  "letter_c",
  "flag_red",
  "flag_blue",
  "flag_green",
  "flag_yellow",
  "flag_white",
  "flag_black",
  "flag_orange",
  "flag_star",
  "flag_crescent",
  "flag_emblem",
  "pop_over_50m",
  "pop_under_1m",
  "area_over_1m",
  "area_under_10k",
  "gdp_over_30k",
  "gdp_under_2k",
  "eu",
  "nato",
  "commonwealth",
  "brics_opec",
  "monarchy",
  "drives_left",
  "lang_en",
  "lang_fr",
  "lang_es",
  "lang_ar",
] as const;

export type RuleId = (typeof RULE_ID_LIST)[number];

export interface RuleDef {
  id: RuleId;
  kind: RuleKind;
  group?: string;
  label: string;
  /** Failure phrase, e.g. "isn't in Africa". */
  why: string;
  test(c: Country): boolean;
  /** Stat rules: the reading exists. Omitted means always known. */
  known?(c: Country): boolean;
}

/** Cell index is r*3+c; answers are sorted iso2 lists. */
export interface Grid {
  rows: RuleId[];
  cols: RuleId[];
  answers: string[][];
}

export interface Award {
  points: number;
  parts: string[];
}

export interface Puzzle {
  guildId: string;
  date: string;
  grid: Grid;
}

/** `cells` holds nine iso2 codes, "" when empty. */
export interface Game {
  guildId: string;
  date: string;
  userId: string;
  cells: string[];
  guesses: number;
  lastMiss: string | null;
  filled: number | null;
  points: number | null;
  streak: number | null;
  startedAt: number;
  finishedAt: number | null;
}

export interface Practice {
  guildId: string;
  userId: string;
  grid: Grid;
  cells: string[];
  guesses: number;
  lastMiss: string | null;
  points: number;
  startedAt: number;
  finishedAt: number | null;
}
