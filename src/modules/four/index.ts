import type { Jev } from "../../core/jev/types.ts";
import type { BotModule } from "../../core/types.ts";
import { fourCommand } from "./commands/four.ts";
import { dropHandler } from "./components/drop.ts";
import { pageHandler } from "./components/page.ts";
import { resignHandler } from "./components/resign.ts";
import { fourMigrations } from "./store/migrations.ts";

/** On only when JEV_URL is set: jevos picks its drops through the shared jev queue. */
export function fourModule(jev: Jev): BotModule {
  const deps = { jev, random: Math.random };

  return {
    name: "four",
    title: "🔴 Four in a row",
    helpNote:
      "jevos is the local yes/no model (jev): code works out facts per column (and on normal/hard plays forced moves and rules out losing ones); jevos picks among the rest.",
    commands: [fourCommand(deps)],
    components: [dropHandler(deps), resignHandler, pageHandler],
    migrations: fourMigrations,
  };
}
