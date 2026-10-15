import type { BotModule } from "../../core/module.ts";
import { motorsportCommand } from "./commands.ts";
import { motorsportComponents } from "./components.ts";
import { motorsportEvents } from "./events.ts";
import { motorsportJobs } from "./jobs.ts";
import { motorsportMigrations } from "./repo.ts";

export const motorsportModule: BotModule = {
  name: "motorsport",
  title: "🏁 Motorsport",
  commands: [motorsportCommand],
  components: motorsportComponents,
  events: motorsportEvents,
  jobs: motorsportJobs,
  migrations: motorsportMigrations,
};
