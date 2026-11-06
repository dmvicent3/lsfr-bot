import { pointsSource } from "../../core/points.ts";
import type { PointsSource } from "../../core/points-types.ts";

export const triviaPoints: PointsSource[] = [
  pointsSource({ game: "trivia", label: "Trivia", table: "trivia_scores" }),
];
