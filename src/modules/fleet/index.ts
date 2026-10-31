import type { Jev } from "../../core/jev/types.ts";
import type { BotModule } from "../../core/types.ts";
import { fleetCommand } from "./commands/fleet.ts";
import { controls } from "./components/controls.ts";
import { pageHandler } from "./components/page.ts";
import { fleetMigrations } from "./store/migrations.ts";

/** On only when JEV_URL is set: jevos picks its shots through the shared jev queue. */
export function fleetModule(jev: Jev, random: () => number = Math.random): BotModule {
  const deps = { jev, random };

  return {
    name: "fleet",
    title: "🚢 Hidden fleet",
    helpNote:
      "Place your five ships, then take turns firing at jevos's hidden fleet. Code narrows where jevos can fire; jevos (the local yes/no model) picks among those cells.",
    commands: [fleetCommand(deps)],
    components: [...controls.map((c) => c(deps)), pageHandler],
    migrations: fleetMigrations,
  };
}
