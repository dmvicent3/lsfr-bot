import type { BotModule } from "../../core/types.ts";
import { motorsportCommand } from "./commands/commands.ts";
import { motorsportComponents } from "./components/components.ts";
import { motorsportEvents } from "./events.ts";
import { motorsportJobs } from "./jobs.ts";
import { motorsportPoints } from "./points.ts";
import { motorsportMigrations } from "./store/migrations.ts";

/** `homeGuildId`: the one server motorsport serves (config.guildId); F1 predictions pay there. */
export function motorsportModule(homeGuildId: string): BotModule {
  return {
    name: "motorsport",
    title: "🏁 Motorsport",
    helpNote:
      "Use 🔮 Predict on a pinned schedule to call a podium: 5 pts per exact position, 2 for a podium driver in the wrong place, +5 for all three. F1: every qualifying, sprint and race of the weekend, locked at its first one; each pays gacha pulls (Qualifying 10, Race 20, Sprint Qualifying and Sprint 5 for 20 pts), and four chips, each once a season, one per weekend: ⏫ Double Weekend, 🎯 Triple Pick, 🛡️ Safety Net, 🔁 Late Swap. Other series: races and sprints, each until it starts.",
    commands: [motorsportCommand],
    components: motorsportComponents,
    events: motorsportEvents,
    jobs: motorsportJobs,
    migrations: motorsportMigrations,
    points: motorsportPoints(homeGuildId),
  };
}
