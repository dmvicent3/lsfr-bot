/**
 * Player feedback and polls, for Gork's developer. Talks to Discord over REST only (no gateway
 * login), so it runs beside the bot with the same DATABASE_PATH and DISCORD_TOKEN.
 * Usage (on the Pi): docker exec lsfr-bot-bot-1 bun scripts/feedback.ts <command>
 *   list [--all] [--topic <t>]
 *   read <id...> | read --all
 *   poll <question> --option <text> (2-10 times) [--hours 24] [--multi] [--guild <id>]
 *   polls
 *   results <id>
 */
import { REST } from "discord.js";
import { loadConfig } from "../src/core/config.ts";
import { openDatabase, runMigrations } from "../src/core/db.ts";
import { coreMigrations } from "../src/core/settings.ts";
import { runScript } from "../src/modules/feedback/script/run.ts";
import { feedbackMigrations } from "../src/modules/feedback/store/migrations.ts";
import { FeedbackRepo } from "../src/modules/feedback/store/repo.ts";

const config = loadConfig(process.env);
const db = openDatabase(config.databasePath);
runMigrations(db, [...coreMigrations, ...feedbackMigrations]);
const rest = new REST().setToken(config.discordToken);

try {
  const out = await runScript(process.argv.slice(2), {
    db,
    repo: new FeedbackRepo(db),
    rest,
    now: Date.now(),
  });

  if (out.ok) console.log(out.text);
  else console.error(out.text);

  process.exitCode = out.ok ? 0 : 1;
} catch (err) {
  console.error(err instanceof Error ? err.message : String(err));
  process.exitCode = 1;
} finally {
  db.close();
}
