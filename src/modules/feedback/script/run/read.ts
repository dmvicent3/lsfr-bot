import type { Args, Outcome, ScriptDeps } from "../types.ts";

/** Marks entries read, so `list` stops showing them. */
export async function read(args: Args["read"], d: ScriptDeps): Promise<Outcome> {
  const marked = d.repo.entries.markRead(args.ids, d.now);

  return { ok: true, text: `Marked ${marked} read.` };
}
