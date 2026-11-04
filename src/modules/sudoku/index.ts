import type { BotModule } from "../../core/types.ts";
import { sudokuCommand } from "./commands/commands.ts";
import { sudokuComponents } from "./components/components.ts";
import { sudokuMigrations } from "./store/migrations.ts";

export function sudokuModule(random: () => number = Math.random): BotModule {
  return {
    name: "sudoku",
    title: "🔢 Sudoku",
    helpNote:
      "One medium puzzle a day, the same for everyone in the server, plus practice puzzles (easy, medium or hard); boards are private.",
    commands: [sudokuCommand(random)],
    components: sudokuComponents(random),
    migrations: sudokuMigrations,
  };
}
