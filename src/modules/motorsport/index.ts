import type { BotModule } from "../../core/types.ts";
import { motorsportCommand } from "./commands.ts";
import { motorsportComponents } from "./components.ts";
import { motorsportEvents } from "./events.ts";
import { motorsportJobs } from "./jobs.ts";
import { motorsportMigrations } from "./store/migrations.ts";

export const motorsportModule: BotModule = {
  name: "motorsport",
  title: "🏁 Motorsport",
  helpNote:
    "Use 🔮 Predict on a pinned schedule to call the podium of a race or sprint before it starts: 5 pts per exact position, 2 for a podium driver in the wrong place, +5 for all three.",
  commands: [motorsportCommand],
  components: motorsportComponents,
  events: motorsportEvents,
  jobs: motorsportJobs,
  migrations: motorsportMigrations,
};
