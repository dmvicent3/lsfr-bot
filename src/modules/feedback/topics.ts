import type { BotModule } from "../../core/types.ts";

/** Commands no player would give feedback on. */
const EXCLUDED = new Set(["help", "feedback", "dailies"]);
/** Discord allows 25 choices; one is kept for `other`. */
const MAX_NAMED = 24;

/** The /feedback topics: the modules' command names, sorted, then `other`. */
export function feedbackTopics(modules: BotModule[]): string[] {
  const names = modules
    .flatMap((m) => (m.commands ?? []).map((c) => c.data.name))
    .filter((name) => !EXCLUDED.has(name));

  return [...new Set(names)].toSorted().slice(0, MAX_NAMED).concat("other");
}
