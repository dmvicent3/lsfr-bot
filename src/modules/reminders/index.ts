import type { BotModule } from "../../core/types.ts";
import { remindCommand } from "./commands/commands.ts";
import { remindersComponents } from "./components.ts";
import { remindersJobs } from "./jobs.ts";
import { remindersMigrations } from "./store/migrations.ts";

export const remindersModule: BotModule = {
  name: "reminders",
  title: "⏰ Reminders",
  helpNote:
    "Times are Lisbon time: `30m`, `2h`, `1d 3h`, `18:00` or `18h00`, `tomorrow 9:00`, `mon 9:00`, `2026-11-02 14:30`. The ping has snooze and done buttons for you, the member pinged, or anyone in the role pinged.",
  commands: [remindCommand],
  components: remindersComponents,
  jobs: remindersJobs,
  migrations: remindersMigrations,
};
