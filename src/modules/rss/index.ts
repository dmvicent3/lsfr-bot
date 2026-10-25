import { createJev } from "../../core/jev.ts";
import type { BotModule } from "../../core/module.ts";
import { rssCommand } from "./commands.ts";
import { rssJobs } from "./jobs.ts";
import { rssMigrations } from "./repo.ts";

/** On only when JEV_URL is set: every article of a server with rules goes through jev. */
export function rssModule(jevUrl: string): BotModule {
  return {
    name: "rss",
    title: "📰 News",
    helpNote:
      "Feeds are checked every 15 minutes. New articles are posted unless a rule matches; rules are judged by a local model (jev), so they work by meaning, not keywords.",
    commands: [rssCommand],
    jobs: rssJobs(createJev({ url: jevUrl })),
    migrations: rssMigrations,
  };
}
