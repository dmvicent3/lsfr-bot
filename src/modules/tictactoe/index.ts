import type { Jev } from "../../core/jev/types.ts";
import type { BotModule } from "../../core/types.ts";
import { tictactoeCommand } from "./commands/start.ts";
import { moveHandler } from "./components/move.ts";
import { resignHandler } from "./components/resign.ts";
import { tictactoeMigrations } from "./store/migrations.ts";

/** On only when JEV_URL is set: jevos picks every move through the shared jev queue. */
export function tictactoeModule(jev: Jev): BotModule {
  const deps = { jev, random: Math.random };

  return {
    name: "tictactoe",
    title: "⭕ Tic-tac-toe",
    helpNote:
      "jevos is the local yes/no model (jev): it plays by judging facts about each square, so it's beatable.",
    commands: [tictactoeCommand(deps)],
    components: [moveHandler(deps), resignHandler],
    migrations: tictactoeMigrations,
  };
}
