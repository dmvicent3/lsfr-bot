import { FINISHED, pointsSource } from "../../core/points.ts";
import type { PointsSource } from "../../core/points-types.ts";

export const gridPoints: PointsSource[] = [
  pointsSource({ game: "grid", label: "Country grid", table: "grid_games", where: FINISHED }),
];
