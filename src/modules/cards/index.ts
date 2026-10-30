import type { BotModule } from "../../core/types.ts";
import { cardsCommand } from "./commands/commands.ts";
import { handHandler } from "./components/hand.ts";
import { joinHandler } from "./components/join.ts";
import { leaveHandler } from "./components/leave.ts";
import { pageHandler } from "./components/page.ts";
import { playHandler } from "./components/play.ts";
import { startHandler } from "./components/start.ts";
import { voteHandler } from "./components/vote.ts";
import { readyEvent } from "./events/ready.ts";
import { cardsMigrations } from "./store/migrations.ts";

export function cardsModule(random: () => number = Math.random): BotModule {
  return {
    name: "cards",
    title: "🃏 Gork Cards",
    helpNote:
      "Start with /cards start, join with the button, fill the blanks from your hand, then vote for the funniest. Add your own cards with /cards add.",
    commands: [cardsCommand(random)],
    components: [
      joinHandler,
      leaveHandler,
      startHandler,
      handHandler,
      playHandler,
      voteHandler,
      pageHandler,
    ],
    events: [readyEvent],
    migrations: cardsMigrations,
  };
}
