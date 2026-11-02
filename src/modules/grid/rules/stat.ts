import type { Country } from "../../../core/countries/types.ts";
import type { RuleDef } from "../types.ts";

type StatId =
  | "pop_over_50m"
  | "pop_under_1m"
  | "area_over_1m"
  | "area_under_10k"
  | "gdp_over_30k"
  | "gdp_under_2k";
interface Check {
  test(c: Country): boolean;
  known(c: Country): boolean;
}

const has = (stat: string) => (c: Country) => c.values[stat]?.value !== undefined;

function over(stat: string, limit: number): Check {
  return { test: (c) => (c.values[stat]?.value ?? -Infinity) > limit, known: has(stat) };
}

function under(stat: string, limit: number): Check {
  return { test: (c) => (c.values[stat]?.value ?? Infinity) < limit, known: has(stat) };
}

const def = (id: StatId, label: string, why: string, check: Check): RuleDef & { id: StatId } => ({
  id,
  kind: "stat",
  label,
  why,
  ...check,
});
export const STAT = [
  def("pop_over_50m", "Population over 50M", "population isn't over 50M", over("population", 5e7)),
  def("pop_under_1m", "Population under 1M", "population isn't under 1M", under("population", 1e6)),
  def("area_over_1m", "Area over 1M km²", "area isn't over 1M km²", over("area", 1e6)),
  def("area_under_10k", "Area under 10k km²", "area isn't under 10k km²", under("area", 1e4)),
  def(
    "gdp_over_30k",
    "GDP per capita over $30k",
    "GDP per capita isn't over $30k",
    over("gdp_pc", 3e4),
  ),
  def(
    "gdp_under_2k",
    "GDP per capita under $2k",
    "GDP per capita isn't under $2k",
    under("gdp_pc", 2e3),
  ),
];
