import { readSnapshot } from "../../core/countries/load.ts";
import type { Snapshot } from "../../core/countries/types.ts";
import type { BotModule } from "../../core/types.ts";
import { gridCommand } from "./commands/commands.ts";
import { gridComponents } from "./components/components.ts";
import { gridModals } from "./modals.ts";
import { gridMigrations } from "./store/migrations.ts";
import { gridPoints } from "./points.ts";

export function gridModule(
  snapshotSource: () => Snapshot | null = () => readSnapshot(),
  random: () => number = Math.random,
): BotModule {
  return {
    name: "grid",
    title: "🗺️ Country grid",
    helpNote:
      "A 3×3 grid of country rules a day, the same for everyone in the server; answers are private. Data: World Bank Open Data (CC BY 4.0), Wikidata (CC0), flags from Wikimedia Commons.",
    commands: [gridCommand(snapshotSource, random)],
    components: gridComponents(snapshotSource, random),
    modals: gridModals(snapshotSource),
    migrations: gridMigrations,
    points: gridPoints,
  };
}
