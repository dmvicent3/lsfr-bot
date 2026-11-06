import { FINISHED, pointsSource } from "../../core/points.ts";
import type { PointsSource } from "../../core/points-types.ts";

export const crosswordPoints: PointsSource[] = [
  pointsSource({
    game: "crossword",
    label: "Crossword",
    table: "crossword_games",
    where: FINISHED,
  }),
];
