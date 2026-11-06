import type { PointsUnit } from "../../../core/points-types.ts";

/** How many currency one unit of each kind of earning is worth at the server's pull price. */
const RATE: Record<PointsUnit, (price: number) => number> = {
  points: () => 1,
  pulls: (price) => price,
};

/** Each game's earnings as currency: points as they are, pulls at `price` each, rounded. */
export const inCurrency = <G extends { points: number; unit: PointsUnit }>(
  games: readonly G[],
  price: number,
): G[] => games.map((g) => ({ ...g, points: Math.round(g.points * RATE[g.unit](price)) }));
