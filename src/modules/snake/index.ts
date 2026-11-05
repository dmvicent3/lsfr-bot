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
      "A daily hidden word of 4–10 letters (its length is secret): guess any word, as often as you like. 🟩 letters are in the word in that order, joined when they sit side by side, rounded where the word starts or ends; 🟨 are in the word elsewhere. The same word for everyone in the server; your board is private. Words: ENABLE (public domain) and FrequencyWords. Board font: DejaVu Sans.",
    commands: [snakeCommand(random)],
    components: snakeComponents(random),
    modals: snakeModals(),
    migrations: snakeMigrations,
  };
}
