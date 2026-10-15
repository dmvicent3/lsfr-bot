import type { Database } from "bun:sqlite";
import type {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  Client,
  ClientEvents,
  MessageComponentInteraction,
  RESTPostAPIChatInputApplicationCommandsJSONBody,
} from "discord.js";
import type { Config } from "./config.ts";
import type { Migration } from "./db.ts";

export interface Ctx {
  client: Client;
  db: Database;
  config: Config;
}

export interface SlashCommand {
  data: RESTPostAPIChatInputApplicationCommandsJSONBody;
  execute(i: ChatInputCommandInteraction, ctx: Ctx): Promise<void>;
  autocomplete?(i: AutocompleteInteraction, ctx: Ctx): Promise<void>;
}

/** Handles components whose custom ID starts with `id` ("<module>:<action>"). */
export interface ComponentHandler {
  id: string;
  handle(i: MessageComponentInteraction, args: string[], ctx: Ctx): Promise<void>;
}

export interface EventHandler {
  event: keyof ClientEvents;
  handle(ctx: Ctx, ...args: unknown[]): Promise<void>;
}

export interface Job {
  name: string;
  cron: string;
  runOnStart?: boolean;
  run(ctx: Ctx): Promise<void>;
}

export interface BotModule {
  name: string;
  commands?: SlashCommand[];
  components?: ComponentHandler[];
  events?: EventHandler[];
  jobs?: Job[];
  migrations?: Migration[];
}
