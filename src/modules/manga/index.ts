import type { BotModule } from "../../core/types.ts";
import { createClient } from "./api/client.ts";
import { mangaCommand } from "./commands/commands.ts";
import { mangaJobs } from "./jobs.ts";
import { mangaMigrations } from "./store/migrations.ts";

/** One MangaDex client for the commands and the poll, so its spacing covers both. */
export function mangaModule(): BotModule {
  const get = createClient({ fetchFn: fetch, sleep: (ms) => Bun.sleep(ms), now: () => Date.now() });

  return {
    name: "manga",
    title: "📚 Manga",
    helpNote:
      "New English chapters of followed manga are checked every 4 hours and posted once per chapter in the manga channel, pinging that manga's followers.",
    commands: [mangaCommand(get)],
    jobs: mangaJobs(get),
    migrations: mangaMigrations,
  };
}
