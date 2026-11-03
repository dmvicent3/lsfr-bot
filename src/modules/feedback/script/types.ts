import type { Database } from "bun:sqlite";
import type { FeedbackRepo } from "../store/repo.ts";

/** The part of discord.js `REST` the script uses; tests pass a fake. */
export interface Rest {
  get(route: `/${string}`, options?: { query?: URLSearchParams }): Promise<unknown>;
  post(route: `/${string}`, options?: { body?: unknown }): Promise<unknown>;
}

export interface ScriptDeps {
  db: Database;
  repo: FeedbackRepo;
  rest: Rest;
  now: number;
}

export interface PollRequest {
  question: string;
  options: string[];
  hours: number;
  multi: boolean;
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

/** The poll on a message: whether Discord has finalised it, and its answers. */
export interface PollState {
  finalized: boolean;
  answers: { id: number; text: string; count: number | null }[];
}

/** Where a poll goes. */
export interface PollTarget {
  guildId: string;
  channelId: string;
}
