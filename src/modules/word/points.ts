import { FINISHED, pointsSource } from "../../core/points.ts";
import type { PointsSource } from "../../core/points-types.ts";
import { MODE_LIST, MODES } from "./multi/modes.ts";

/** Classic, then Duo and Quad from the shared multi table. */
export const wordPoints: PointsSource[] = [
  pointsSource({ game: "word", label: "Word", table: "word_games", where: FINISHED }),
  ...MODE_LIST.map((mode) =>
    pointsSource({
      game: mode,
      label: MODES[mode].name,
      table: "word_multi_games",
      where: `mode = '${mode}' AND ${FINISHED}`,
    }),
  ),
];
