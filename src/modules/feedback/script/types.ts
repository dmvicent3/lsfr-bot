import type { Database } from "bun:sqlite";
import type { PollRequest, Rest } from "../../../core/polls/types.ts";
import type { FeedbackRepo } from "../store/repo.ts";

export type { PollRequest, PollState, Rest } from "../../../core/polls/types.ts";

export interface ScriptDeps {
  db: Database;
  repo: FeedbackRepo;
  rest: Rest;
  now: number;
}

/** Each command's arguments, by command name. */
export interface Args {
  list: { all: boolean; topic: string | null };
  read: { ids: number[] | "all" };
  poll: { poll: PollRequest; guildId: string | null };
  polls: Record<string, never>;
  results: { id: number };
  say: { text: string; guildId: string | null; close: number[] };
  close: { ids: number[] };
}

export type CommandName = keyof Args;

/** One parsed command; `name` picks the shape of `args`. */
export type Command<K extends CommandName = CommandName> = {
  [P in K]: { name: P; args: Args[P] };
}[K];

export type Parsed = Command | { error: string };

/** What the script prints, and whether it succeeded. */
export interface Outcome {
  ok: boolean;
  text: string;
}

/** The command line split into words, `--name value` options and `--flag`s. */
export interface Tokens {
  positional: string[];
  values: Map<string, string[]>;
  flags: Set<string>;
}

/** One answer's votes as read back from Discord. */
export interface Tally {
  text: string;
  count: number;
  voters: string[];
}

/** Where a poll goes. */
export interface PollTarget {
  guildId: string;
  channelId: string;
}
