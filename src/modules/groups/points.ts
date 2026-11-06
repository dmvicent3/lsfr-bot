import { FINISHED, pointsSource } from "../../core/points.ts";
import type { PointsSource } from "../../core/points-types.ts";

export const groupsPoints: PointsSource[] = [
  pointsSource({ game: "groups", label: "Groups", table: "groups_games", where: FINISHED }),
];
