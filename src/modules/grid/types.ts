import type { Country } from "../../core/countries/types.ts";

export type RuleKind = "geo" | "flag" | "stat" | "politics";

export type RuleId =
  | "africa"
  | "asia"
  | "europe"
  | "north_america"
  | "south_america"
  | "oceania"
  | "landlocked"
  | "island"
  | "borders_4"
  | "borders_0_1"
  | "letter_a"
  | "letter_b"
  | "letter_s"
  | "letter_m"
  | "letter_c"
  | "flag_red"
  | "flag_blue"
  | "flag_green"
  | "flag_yellow"
  | "flag_white"
  | "flag_black"
  | "flag_orange"
  | "flag_star"
  | "flag_crescent"
  | "flag_emblem"
  | "pop_over_50m"
  | "pop_under_1m"
  | "area_over_1m"
  | "area_under_10k"
  | "gdp_over_30k"
  | "gdp_under_2k"
  | "eu"
  | "nato"
  | "commonwealth"
  | "brics_opec"
  | "monarchy"
  | "drives_left"
  | "lang_en"
  | "lang_fr"
  | "lang_es"
  | "lang_ar";

export interface RuleDef {
  id: RuleId;
  kind: RuleKind;
  group?: string;
  label: string;
  /** Failure phrase, e.g. "isn't in Africa". */
  why: string;
  test(c: Country): boolean;
}
