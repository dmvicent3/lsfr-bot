import { pollsText } from "../format.ts";
import type { Outcome, ScriptDeps } from "../types.ts";

/** The stored polls, open or closed. */
export async function polls(_args: unknown, d: ScriptDeps): Promise<Outcome> {
  return { ok: true, text: pollsText(d.repo.polls.all(), d.now) };
}
