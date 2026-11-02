import type { BotModule } from "../../core/types.ts";
import { duelCommand } from "./commands/commands.ts";
import { duelComponents } from "./components/components.ts";
import { readSnapshot } from "./data/load.ts";
import { duelMigrations } from "./store/migrations.ts";
import type { Snapshot } from "./types.ts";

export function duelModule(snapshotSource: () => Snapshot | null = readSnapshot): BotModule {
  return {
    name: "duel",
    title: "📊 Stat duel",
    helpNote:
      "Five country comparisons a day, the same for everyone in the server; answers are private. Data: World Bank Open Data (CC BY 4.0) and Wikidata (CC0).",
    commands: [duelCommand(snapshotSource)],
    components: duelComponents(),
    migrations: duelMigrations,
  };
}
