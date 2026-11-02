import { cellPoints } from "../../../../src/modules/grid/scoring.ts";
import { validFor } from "../../../../src/modules/grid/generate/valid.ts";
import type { Grid, RuleId } from "../../../../src/modules/grid/types.ts";
import { empty, obs, snapshot } from "../play/fixtures.ts";

export { obs, snapshot };

const rows: RuleId[] = ["europe", "asia", "africa"];
const cols: RuleId[] = ["flag_red", "island", "landlocked"];

/** Every cell has real answers (3 to 44 countries). */
export const GRID: Grid = {
  rows,
  cols,
  answers: rows.flatMap((r) => cols.map((c) => validFor(snapshot, r, c))),
};

/** Portugal in A1, nothing else. */
export const cells = (): string[] => {
  const c = empty();
  c[0] = "PT";

  return c;
};

export const ptPoints = cellPoints("PT", obs.get("PT") ?? 1);

export const nameOf = (iso2: string): string =>
  snapshot.countries.find((c) => c.iso2 === iso2)!.name;
