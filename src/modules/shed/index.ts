import type { BotModule } from "../../core/types.ts";
import { shedCommand } from "./commands/commands.ts";
import { catchHandler } from "./components/catch.ts";
import { drawHandler } from "./components/draw.ts";
import { handHandler } from "./components/hand.ts";
import { joinHandler } from "./components/join.ts";
import { keepHandler } from "./components/keep.ts";
import { leaderboardPageHandler } from "./components/leaderboard-page.ts";
import { leaveHandler } from "./components/leave.ts";
import { pageHandler } from "./components/page.ts";
import { paintHandler } from "./components/paint.ts";
import { passHandler } from "./components/pass.ts";
import { playHandler } from "./components/play.ts";
import { quitHandler } from "./components/quit.ts";
import { stackingHandler } from "./components/stacking.ts";
import { startHandler } from "./components/start.ts";
import { readyEvent } from "./events/ready.ts";
import { shedMigrations } from "./store/migrations.ts";

export function shedModule(random: () => number = Math.random): BotModule {
  return {
    name: "shed",
    title: "🃏 Shed",
    helpNote:
      "Start a game with /shed new, join with the button, then play matching cards from your hand (My hand). First to empty their hand wins; play goes on until one player is left holding cards.",
    commands: [shedCommand(random)],
    components: [
      joinHandler,
      leaveHandler,
      startHandler,
      stackingHandler,
      handHandler,
      playHandler,
      drawHandler,
      keepHandler,
      passHandler,
      paintHandler,
      catchHandler,
      quitHandler,
      pageHandler,
      leaderboardPageHandler,
    ],
    events: [readyEvent],
    migrations: shedMigrations,
  };
}
