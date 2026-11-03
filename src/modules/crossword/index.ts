import type { BotModule } from "../../core/types.ts";
import { crosswordCommand } from "./commands/commands.ts";
import { crosswordComponents } from "./components/components.ts";
import { crosswordModals } from "./modals.ts";
import type { Ask } from "./play/make.ts";
import { crosswordMigrations } from "./store/migrations.ts";

export function crosswordModule(
  ask: Ask | null = null,
  random: () => number = Math.random,
): BotModule {
  return {
    name: "crossword",
    title: "📰 Crossword",
    helpNote:
      "A daily 5×5 mini crossword, the same for everyone in the server; answers are private. Words: ENABLE (public domain) and FrequencyWords; definitions: Princeton WordNet 3.1 (WordNet licence); clues written by the local model. Grid font: DejaVu Sans.",
    commands: [crosswordCommand(ask, random)],
    components: crosswordComponents(ask, random),
    modals: crosswordModals(),
    migrations: crosswordMigrations,
  };
}
