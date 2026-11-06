import { FINISHED, pointsSource } from "../../core/points.ts";
import type { PointsSource } from "../../core/points-types.ts";

export const duelPoints: PointsSource[] = [
  pointsSource({ game: "duel", label: "Stat duel", table: "duel_games", where: FINISHED }),
];
