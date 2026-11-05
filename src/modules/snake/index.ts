import type { BotModule } from "../../core/types.ts";
import { snakeCommand } from "./commands/commands.ts";
import { snakeComponents } from "./components/components.ts";
import { snakeModals } from "./modals.ts";
import { snakeMigrations } from "./store/migrations.ts";

export function snakeModule(random: () => number = Math.random): BotModule {
  return {
    name: "snake",
    title: "🐍 Snake",
    helpNote:
      "A daily hidden word of 4–10 letters (its length is secret): guess any word, as often as you like. 🟩 letters are in the word in that order, 💚 when they also sit side by side in it, 🟢 when your guess starts or ends the way the word does; 🟨 are in the word elsewhere. The same word for everyone in the server; your board is private. Words: ENABLE (public domain) and FrequencyWords.",
    commands: [snakeCommand(random)],
    components: snakeComponents(random),
    modals: snakeModals(),
    migrations: snakeMigrations,
  };
}
