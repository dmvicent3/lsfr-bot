import { pointsSource } from "../../core/points.ts";
import type { PointsSource } from "../../core/points-types.ts";

export const shedPoints: PointsSource[] = [
  pointsSource({ game: "shed", label: "Shed", table: "shed_places" }),
];
