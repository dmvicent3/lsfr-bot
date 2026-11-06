import type { BotModule } from "../../core/types.ts";
import { wordCommand } from "./commands/commands.ts";
import { modeCommand } from "./commands/mode.ts";
import { multiAnswerHandler } from "./components/multi-answer.ts";
import { multiGiveUpHandler } from "./components/multi-give-up.ts";
import { multiGuessHandler } from "./components/multi-guess.ts";
import { pageHandlers } from "./components/page.ts";
import { wordMigrations } from "./store/migrations.ts";
import { wordPoints } from "./points.ts";

/** Classic `/word`, and Word Duo and Quad as their own `/duo` and `/quad` on the same tables. */
export function wordModule(random: () => number = Math.random): BotModule {
  return {
    name: "word",
    title: "🟩 Word",
    helpNote:
      "One English word a day, the same for everyone in the server; guesses are private. `/duo` and `/quad` are two and four words at once, each its own daily.",
    commands: [wordCommand(random), modeCommand("duo", random), modeCommand("quad", random)],
    components: [...pageHandlers, multiGuessHandler, multiGiveUpHandler],
    modals: [multiAnswerHandler],
    migrations: wordMigrations,
    points: wordPoints,
  };
}
