import { pointsSource } from "../../core/points.ts";
import type { PointsSource } from "../../core/points-types.ts";
import { WIN_POINTS } from "./store/results.ts";

export const fleetPoints: PointsSource[] = [
  pointsSource({
    game: "fleet",
    label: "Hidden fleet",
    table: "fleet_results",
    user: "player_id",
    expr: WIN_POINTS,
    where: "result = 'win'",
  }),
];
