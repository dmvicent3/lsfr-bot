import { pointsSource } from "../../core/points.ts";
import type { PointsSource } from "../../core/points-types.ts";
import { WIN_POINTS } from "./store/results.ts";

export const fourPoints: PointsSource[] = [
  pointsSource({
    game: "four",
    label: "Four in a row",
    table: "four_results",
    user: "player_id",
    expr: WIN_POINTS,
    where: "result = 'win'",
  }),
];
