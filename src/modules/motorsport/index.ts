import type { BotModule } from "../../core/module.ts";
import { motorsportCommand } from "./commands.ts";
import { motorsportComponents } from "./components.ts";
import { motorsportJobs } from "./jobs.ts";
import { motorsportMigrations } from "./repo.ts";

export const motorsportModule: BotModule = {
  name: "motorsport",
  commands: [motorsportCommand],
  components: motorsportComponents,
  jobs: motorsportJobs,
  migrations: motorsportMigrations,
};
