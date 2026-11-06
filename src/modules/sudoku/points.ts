import { pointsSource } from "../../core/points.ts";
import type { PointsSource } from "../../core/points-types.ts";
import { DAILY_SOLVED } from "./store/rows.ts";

export const sudokuPoints: PointsSource[] = [
  pointsSource({ game: "sudoku", label: "Sudoku", table: "sudoku_games", where: DAILY_SOLVED }),
];
