import type { PredictionRules } from "./types.ts";
import type { SeriesKey } from "../types.ts";

/**
 * F1 plays like F1 Fantasy: every scored session of the weekend, one lock, chips and pulls.
 * Other result series predict races and sprints, each locking at its own start.
 */
const RULES: Partial<Record<SeriesKey, PredictionRules>> = {
  f1: {
    kinds: ["qualifying", "sprint-qualifying", "sprint", "race"],
    fantasy: true,
    pulls: { qualifying: 10, race: 20, "sprint-qualifying": 5, sprint: 5 },
  },
  motogp: { kinds: ["sprint", "race"], fantasy: false, pulls: {} },
};

const NONE: PredictionRules = { kinds: [], fantasy: false, pulls: {} };

export const rulesOf = (series: SeriesKey): PredictionRules => RULES[series] ?? NONE;
