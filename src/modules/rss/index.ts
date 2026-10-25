import { createJev } from "../../core/jev/queue.ts";
import type { BotModule } from "../../core/module.ts";
import { rssCommand } from "./commands/commands.ts";
import { rssComponents } from "./commands/components.ts";
import { rssJobs } from "./jobs.ts";
import { rssMigrations } from "./store/migrations.ts";

/** On only when JEV_URL is set: every article of a server with rules goes through jev. */
export function rssModule(jevUrl: string): BotModule {
  return {
    name: "rss",
    title: "📰 News",
    helpNote:
      "Feeds are checked every 15 minutes. A new article is posted unless a block rule matches and, if its feed has only-rules, when one of them matches. Rules can be limited to some feeds and are judged by a local model (jev), so they work by meaning, not keywords.",
    commands: [rssCommand],
    components: rssComponents,
    jobs: rssJobs(createJev({ url: jevUrl })),
    migrations: rssMigrations,
  };
}
