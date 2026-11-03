import { parsePoll } from "./poll-args.ts";
import { parseSay } from "./say-args.ts";
import { lastValue, positiveId, tokenize } from "./tokens.ts";
import type { CommandName, Parsed } from "./types.ts";
import { USAGE } from "./usage.ts";

function parseList(argv: string[]): Parsed {
  const t = tokenize(argv, { values: ["topic"], flags: ["all"] });

  if (typeof t === "string") return { error: t };

  if (t.positional.length > 0) return { error: "list takes no words, only --all and --topic." };

  return { name: "list", args: { all: t.flags.has("all"), topic: lastValue(t, "topic") } };
}

function parseRead(argv: string[]): Parsed {
  if (argv.length === 1 && argv[0] === "--all") return { name: "read", args: { ids: "all" } };

  const ids = argv.map(positiveId);

  if (ids.length === 0) return { error: "read needs entry ids or --all." };

  const valid = ids.filter((id) => id !== null);

  return valid.length === ids.length
    ? { name: "read", args: { ids: valid } }
    : { error: "read takes entry ids (whole numbers) or --all." };
}

const parsePolls = (argv: string[]): Parsed =>
  argv.length === 0 ? { name: "polls", args: {} } : { error: "polls takes no arguments." };

function parseResults(argv: string[]): Parsed {
  const id = argv.length === 1 ? positiveId(argv[0] ?? "") : null;

  return id === null ? { error: "results takes one poll id." } : { name: "results", args: { id } };
}

const PARSERS: Record<CommandName, (argv: string[]) => Parsed> = {
  list: parseList,
  read: parseRead,
  poll: parsePoll,
  polls: parsePolls,
  results: parseResults,
  say: parseSay,
};

const isCommandName = (name: string): name is CommandName => Object.hasOwn(PARSERS, name);

/** The command line after `bun scripts/feedback.ts`. */
export function parseArgs(argv: string[]): Parsed {
  const [name = "", ...rest] = argv;

  return isCommandName(name) ? PARSERS[name](rest) : { error: USAGE };
}
