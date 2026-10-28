import type { BotModule } from "../../core/types.ts";
import { wordCommand } from "./commands/commands.ts";
import { pageHandler } from "./components/page.ts";
import { wordMigrations } from "./store/migrations.ts";

export function wordModule(random: () => number = Math.random): BotModule {
  return {
    name: "word",
    title: "🟩 Word",
    helpNote: "One English word a day, the same for everyone in the server; guesses are private.",
    commands: [wordCommand(random)],
    components: [pageHandler],
    migrations: wordMigrations,
  };
}
