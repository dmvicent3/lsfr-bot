import type { BotModule } from "../../core/types.ts";
import { triviaCommand } from "./commands/commands.ts";
import { pageHandler } from "./components/page.ts";
import { pickHandler } from "./components/pick.ts";
import { topicHandler } from "./components/topic.ts";
import { messageEvent } from "./events/message.ts";
import { readyEvent } from "./events/ready.ts";
import { triviaMigrations } from "./store/migrations.ts";

export function triviaModule(random: () => number = Math.random): BotModule {
  return {
    name: "trivia",
    title: "🧠 Trivia",
    helpNote:
      "Start with /trivia start; type answers in the channel, or click for button questions. Some rounds are pictures: name the flag, painting, artist, place, person or club. Stops itself when nobody's playing.",
    commands: [triviaCommand(random)],
    components: [pickHandler, topicHandler, pageHandler],
    events: [messageEvent, readyEvent],
    migrations: triviaMigrations,
  };
}
