import { entriesText } from "../format.ts";
import { userNames } from "../rest-reads.ts";
import type { Args, Outcome, ScriptDeps } from "../types.ts";

/** Unread entries (or all), oldest first, with the authors' names. */
export async function list(args: Args["list"], d: ScriptDeps): Promise<Outcome> {
  const entries = d.repo.entries.list(args);
  const names = await userNames(
    d.rest,
    entries.map((e) => e.userId),
  );

  return { ok: true, text: entriesText(entries, names) };
}
