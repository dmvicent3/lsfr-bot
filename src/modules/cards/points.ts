import { pointsSource } from "../../core/points.ts";
import type { PointsSource } from "../../core/points-types.ts";

/** The leaderboard counts round wins: one point each. */
export const cardsPoints: PointsSource[] = [
  pointsSource({ game: "cards", label: "Gork Cards", table: "cards_wins", expr: "1" }),
];
