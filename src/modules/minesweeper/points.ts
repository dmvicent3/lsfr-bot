import { pointsSource } from "../../core/points.ts";
import type { PointsSource } from "../../core/points-types.ts";

export const minesweeperPoints: PointsSource[] = [
  pointsSource({
    game: "minesweeper",
    label: "Minesweeper",
    table: "minesweeper_games",
    user: "player_id",
    where: "kind = 'daily' AND finished_at IS NOT NULL",
  }),
];
