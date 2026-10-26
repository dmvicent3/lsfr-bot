import { createEmbedder } from "../../core/embed/http.ts";
import { createJev } from "../../core/jev/queue.ts";
import type { BotModule } from "../../core/types.ts";
import { rssCommand } from "./commands/commands.ts";
import { rssComponents } from "./commands/components.ts";
import { rssJobs } from "./jobs.ts";
import { rssMigrations } from "./store/migrations.ts";

/**
 * On only when JEV_URL is set: every article of a server with rules goes through jev. With an
 * embed URL, articles repeating a story posted in the last day are skipped.
 */
export function rssModule(jevUrl: string, embedUrl: string | null): BotModule {
  return {
    name: "rss",
    title: "📰 News",
    helpNote:
      "Feeds are checked every 15 minutes. A new article is posted unless a block rule matches and, if its feed has only-rules, when one of them matches. Rules can be limited to some feeds and are judged by a local model (jev), so they work by meaning, not keywords. An article about a story already posted in the last 24 hours is skipped.",
    commands: [rssCommand],
    components: rssComponents,
    jobs: rssJobs(createJev({ url: jevUrl }), embedUrl ? createEmbedder({ url: embedUrl }) : null),
    migrations: rssMigrations,
  };
}
