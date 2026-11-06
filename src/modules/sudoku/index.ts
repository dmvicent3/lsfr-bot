import type { BotModule } from "../../core/types.ts";
import { sudokuCommand } from "./commands/commands.ts";
import { sudokuComponents } from "./components/components.ts";
import { sudokuMigrations } from "./store/migrations.ts";
import { sudokuPoints } from "./points.ts";

export function sudokuModule(random: () => number = Math.random): BotModule {
  return {
    name: "sudoku",
    title: "🔢 Sudoku",
    helpNote:
      "One puzzle a day, the same for everyone in the server: pick easy (50), medium (100) or hard (150) on your first open, locked for the day. Practice puzzles at any level; boards are private.",
    commands: [sudokuCommand(random)],
    components: sudokuComponents(random),
    migrations: sudokuMigrations,
    points: sudokuPoints,
  };
}
