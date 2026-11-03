import { parseArgs } from "./args.ts";
import { list } from "./run/list.ts";
import { poll } from "./run/poll.ts";
import { polls } from "./run/polls.ts";
import { read } from "./run/read.ts";
import { results } from "./run/results.ts";
import type { Args, Command, CommandName, Outcome, ScriptDeps } from "./types.ts";

const RUNNERS: { [K in CommandName]: (args: Args[K], d: ScriptDeps) => Promise<Outcome> } = {
  list,
  read,
  poll,
  polls,
  results,
};

const run = <K extends CommandName>(c: Command<K>, d: ScriptDeps): Promise<Outcome> =>
  RUNNERS[c.name](c.args, d);

/** Parses the command line and runs it; Discord errors are thrown. */
export async function runScript(argv: string[], d: ScriptDeps): Promise<Outcome> {
  const parsed = parseArgs(argv);

  if ("error" in parsed) return { ok: false, text: parsed.error };

  return run(parsed, d);
}
