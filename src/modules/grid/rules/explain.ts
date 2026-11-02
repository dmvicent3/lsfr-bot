import type { Country } from "../../../core/countries/types.ts";
import type { RuleId } from "../types.ts";
import { RULES } from "./catalogue.ts";

/** The failure phrase of each rule the country doesn't satisfy. */
export function failures(ids: RuleId[], c: Country): string[] {
  return ids
    .map((id) => RULES[id])
    .filter((r) => !r.test(c))
    .map((r) => r.why);
}
