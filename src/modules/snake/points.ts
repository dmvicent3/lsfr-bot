import { FINISHED, pointsSource } from "../../core/points.ts";
import type { PointsSource } from "../../core/points-types.ts";

export const snakePoints: PointsSource[] = [
  pointsSource({ game: "snake", label: "Snake", table: "snake_games", where: FINISHED }),
];
