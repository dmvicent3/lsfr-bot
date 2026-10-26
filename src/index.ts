import { startBot } from "./core/client.ts";
import { loadConfig } from "./core/config.ts";
import { openDatabase, runMigrations } from "./core/db.ts";
import type { BotModule } from "./core/types.ts";
import { guardProcess } from "./core/process.ts";
import { coreMigrations } from "./core/settings.ts";
import { chatModule } from "./modules/chat/index.ts";
import { helpModule } from "./modules/help/index.ts";
import { mangaModule } from "./modules/manga/index.ts";
import { motorsportModule } from "./modules/motorsport/index.ts";
import { remindersModule } from "./modules/reminders/index.ts";
import { rssModule } from "./modules/rss/index.ts";

guardProcess();
const config = loadConfig(process.env);
const modules: BotModule[] = [
  motorsportModule,
  chatModule,
  remindersModule,
  mangaModule(),
  ...(config.jevUrl ? [rssModule(config.jevUrl, config.embedUrl)] : []),
];
const db = openDatabase(config.databasePath);
runMigrations(db, [...coreMigrations, ...modules.flatMap((m) => m.migrations ?? [])]);
await startBot([...modules, helpModule(modules)], config, db);
