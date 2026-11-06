import type { PointsSource } from "../../core/points-types.ts";
import { chipsByWeekend, leaderboard } from "./predictions/payout.ts";
import { rulesOf } from "./predictions/rules.ts";
import { MotorsportRepo } from "./repo.ts";

/**
 * F1 predictions pay gacha pulls (after chips), all time. Predictions have no server: they
 * belong to the bot's home server, and pay nothing anywhere else.
 */
export function motorsportPoints(homeGuildId: string): PointsSource[] {
  return [
    {
      game: "f1-predictions",
      label: "F1 predictions",
      unit: "pulls",
      earned(db, { guildId, userId }) {
        if (guildId !== homeGuildId) return 0;

        const repo = new MotorsportRepo(db);
        const entries = repo.predictions.scored("f1", {
          kinds: rulesOf("f1").kinds,
          since: 0,
          userId,
        });
        const chips = chipsByWeekend(repo.chips.all("f1", userId));

        return leaderboard("f1", entries, chips)[0]?.pulls ?? 0;
      },
    },
  ];
}
