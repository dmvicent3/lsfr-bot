import type { PointsSource } from "../../core/points-types.ts";
import type { BotModule } from "../../core/types.ts";
import { gachaCommand } from "./commands/commands.ts";
import { gachaMigrations } from "./store/migrations.ts";
import { weeklyJob } from "./weekly/job.ts";

/** `sources`: every game's points (`pointsSources`), which the currency is earned from. */
export function gachaModule(
  sources: readonly PointsSource[],
  random: () => number = Math.random,
): BotModule {
  return {
    name: "gacha",
    title: "🎴 Gacha",
    helpNote:
      "Collect all 794 F1 drivers since 1950: ★5 champions, ★4 race winners, ★3 everyone else. Every point you score in Gork's games is also currency. Each week's limited banner features one ★5 and three ★4s, voted on in polls from Thursday; it resets Monday 00:00. Rates: ★5 0.6 % (rising from pull 74, certain by 90), ★4 5.1 % (certain by 10). Driver data: Jolpica F1 API.",
    commands: [gachaCommand(sources, random)],
    jobs: [weeklyJob(random)],
    migrations: gachaMigrations,
  };
}
