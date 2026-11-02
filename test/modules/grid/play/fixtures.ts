import { loadSnapshotFile } from "../../../../src/core/countries/load.ts";
import { validFor } from "../../../../src/modules/grid/generate/valid.ts";
import { obscurity } from "../../../../src/modules/grid/scoring.ts";
import type { Grid } from "../../../../src/modules/grid/types.ts";

export const snapshot = loadSnapshotFile(
  new URL("../../../../src/core/countries/countries.json", import.meta.url),
)!;
export const obs = obscurity(snapshot);

const rows = ["europe", "asia", "africa"] as const;
const cols = ["eu", "nato", "monarchy"] as const;

/** A real grid whose answers come from the snapshot. */
export const realGrid = (): Grid => ({
  rows: [...rows],
  cols: [...cols],
  answers: rows.flatMap((r) => cols.map((c) => validFor(snapshot, r, c))),
});

export const empty = (): string[] => Array.from({ length: 9 }, () => "");

export const state = (
  over: Partial<{ grid: Grid; cells: string[]; guesses: number; finished: boolean }> = {},
) => ({
  grid: realGrid(),
  cells: empty(),
  guesses: 0,
  finished: false,
  ...over,
});

export const ref = { snapshot, obscurity: obs };
