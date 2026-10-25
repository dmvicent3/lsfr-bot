import { JevError } from "../../../core/jev/http.ts";
import { articleState, buildQuestions, type Rule, rulesFor, verdict } from "../rules/rules.ts";
import type { StoredItem } from "../store/items.ts";
import type { Server } from "../store/servers.ts";
import type { CycleDeps } from "./cycle.ts";
import type { JevOutcome } from "./decisions.ts";

/** Articles classified per server per cycle; the rest wait for the next. */
export const MAX_CLASSIFY = 30;

/** Checks one item against its feed's rules; true when jev was asked. */
async function judge(item: StoredItem, serverRules: Rule[], d: CycleDeps): Promise<boolean> {
  const rules = rulesFor(serverRules, item.feedId);
  if (rules.length === 0) {
    d.repo.items.setState(item.id, "passed");
    return false;
  }
  const answers = await d.jev.yesNo(articleState(item), buildQuestions(rules));
  d.repo.items.setState(item.id, verdict(answers, rules).kind === "pass" ? "passed" : "blocked");
  return true;
}

/** Classifies pending items, oldest first; stops at the first jev failure. */
export async function classify(server: Server, d: CycleDeps): Promise<JevOutcome> {
  const rules = d.repo.rules.list(server.guildId);
  let outcome: JevOutcome = "unused";
  try {
    for (const item of d.repo.items.inState(server.guildId, "pending", MAX_CLASSIFY)) {
      if (await judge(item, rules, d)) outcome = "ok";
    }
  } catch (err) {
    if (!(err instanceof JevError)) throw err;
    return "failed";
  }
  return outcome;
}
