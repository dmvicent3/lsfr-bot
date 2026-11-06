import type { BotModule } from "../../core/types.ts";
import { minesweeperCommand } from "./commands/commands.ts";
import { flagHandler } from "./components/flag.ts";
import { giveUpHandler } from "./components/giveup.ts";
import { moveHandler } from "./components/move.ts";
import { pageHandler } from "./components/page.ts";
import { pickHandler } from "./components/pick.ts";
import { revealHandler } from "./components/reveal.ts";
import { minesweeperPoints } from "./points.ts";
import { minesweeperMigrations } from "./store/migrations.ts";

export function minesweeperModule(random: () => number = Math.random): BotModule {
  return {
    name: "minesweeper",
    title: "💣 Minesweeper",
    helpNote:
      "/minesweeper daily: today's shared board (pick a level once a day), scored by clicks over the board's 3BV. /minesweeper play: practice, any size, the first reveal always safe. Pick a cell with the menus or arrows, then Reveal or Flag.",
    commands: [minesweeperCommand()],
    components: [
      pickHandler("col"),
      pickHandler("row"),
      revealHandler(random),
      flagHandler,
      giveUpHandler,
      moveHandler,
      pageHandler,
    ],
    migrations: minesweeperMigrations,
    points: minesweeperPoints,
  };
}
