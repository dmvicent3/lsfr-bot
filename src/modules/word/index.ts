import type { BotModule } from "../../core/types.ts";
import { wordCommand } from "./commands/commands.ts";
import { multiAnswerHandler } from "./components/multi-answer.ts";
import { multiGiveUpHandler } from "./components/multi-give-up.ts";
import { multiGuessHandler } from "./components/multi-guess.ts";
import { pageHandlers } from "./components/page.ts";
import { wordMigrations } from "./store/migrations.ts";

export function wordModule(random: () => number = Math.random): BotModule {
  return {
    name: "word",
    title: "🟩 Word",
    helpNote:
      "One English word a day, the same for everyone in the server; guesses are private. Word Duo and Word Quad are two and four words at once, each its own daily.",
    commands: [wordCommand(random)],
    components: [...pageHandlers, multiGuessHandler, multiGiveUpHandler],
    modals: [multiAnswerHandler],
    migrations: wordMigrations,
  };
}
