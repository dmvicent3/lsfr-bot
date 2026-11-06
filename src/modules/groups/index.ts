import type { BotModule } from "../../core/types.ts";
import { groupsCommand } from "./commands/commands.ts";
import { groupsComponents } from "./components/components.ts";
import { groupsMigrations } from "./store/migrations.ts";
import { groupsPoints } from "./points.ts";

export function groupsModule(random: () => number = Math.random): BotModule {
  return {
    name: "groups",
    title: "🧩 Groups",
    helpNote:
      "A daily puzzle: sort 16 words into 4 groups of 4, 🟨 easiest to 🟪 hardest, with 4 mistakes allowed. The same for everyone in the server; your board is private. Groups are built in code from Princeton WordNet 3.0 (WordNet licence) and FrequencyWords.",
    commands: [groupsCommand(random)],
    components: groupsComponents(random),
    migrations: groupsMigrations,
    points: groupsPoints,
  };
}
