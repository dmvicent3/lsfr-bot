import type { BotModule } from "../../core/types.ts";
import { minesweeperCommand } from "./commands/commands.ts";
import { flagHandler } from "./components/flag.ts";
import { giveUpHandler } from "./components/giveup.ts";
import { moveHandler } from "./components/move.ts";
import { pickHandler } from "./components/pick.ts";
import { revealHandler } from "./components/reveal.ts";
import { minesweeperMigrations } from "./store/migrations.ts";

export function minesweeperModule(random: () => number = Math.random): BotModule {
  return {
    name: "minesweeper",
    title: "💣 Minesweeper",
    helpNote:
      "Pick a cell with the menus or arrows (play option controls), then Reveal or Flag. The first reveal is always safe.",
    commands: [minesweeperCommand()],
    components: [
      pickHandler("col"),
      pickHandler("row"),
      revealHandler(random),
      flagHandler,
      giveUpHandler,
      moveHandler,
    ],
    migrations: minesweeperMigrations,
  };
}
