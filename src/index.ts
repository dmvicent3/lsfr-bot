import { startBot } from "./core/client.ts";
import { loadConfig } from "./core/config.ts";
import { openDatabase, runMigrations } from "./core/db.ts";
import type { BotModule } from "./core/module.ts";
import { coreMigrations } from "./core/settings.ts";
import { chatModule } from "./modules/chat/index.ts";
import { helpModule } from "./modules/help/index.ts";
import { motorsportModule } from "./modules/motorsport/index.ts";

const modules: BotModule[] = [motorsportModule, chatModule];

const config = loadConfig(process.env);
const db = openDatabase(config.databasePath);
runMigrations(db, [...coreMigrations, ...modules.flatMap((m) => m.migrations ?? [])]);
await startBot([...modules, helpModule(modules)], config, db);
