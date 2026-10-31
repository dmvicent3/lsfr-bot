import type { Database } from "bun:sqlite";
import type {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  Client,
  ClientEvents,
  MessageComponentInteraction,
  RESTPostAPIChatInputApplicationCommandsJSONBody,
} from "discord.js";

export interface Config {
  discordToken: string;
  guildId: string;
  geminiApiKey: string;
  geminiModel: string;
  databasePath: string;
  /** The jev service (RSS filtering, tic-tac-toe); null leaves those modules off. */
  jevUrl: string | null;
  /** The embed service (RSS repeat check); null posts repeats as before. */
  embedUrl: string | null;
}

export interface Migration {
  id: string;
  sql: string;
}

/** What a channel send came to; "lost-channel": the channel or server is gone for good. */
export type SendResult =
  | { result: "ok"; messageId: string }
  | { result: "lost-channel" | "failed" };

/** Dates from `from` to `to`, both YYYY-MM-DD and inclusive. */
export interface DateRange {
  from: string;
  to: string;
  label: string;
}

export type FetchFn = (url: string, init?: RequestInit) => Promise<Response>;

/** Image bytes sent inline, base64-encoded. */
export interface InlineImage {
  mimeType: string;
  data: string;
}

/** A tool the model may call; `parameters` is a JSON schema object. */
export interface ToolSpec {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

/** One chat-completions message, in the bot's own shape (llm.ts maps it to the wire format). */
export type ChatMessage =
  | { role: "system"; content: string }
  | { role: "user"; content: string; images?: InlineImage[] }
  | { role: "assistant"; content: string; toolCalls?: ToolCall[] }
  | { role: "tool"; toolCallId: string; content: string };

export interface LlmOptions {
  /** The llama.cpp server, e.g. http://llm:8019. */
  url: string;
  tools?: ToolSpec[];
  fetchFn?: FetchFn;
  timeoutMs?: number;
}

export interface Turn {
  role: "user" | "model";
  text: string;
  images?: InlineImage[];
}

export interface Ctx {
  client: Client;
  db: Database;
  config: Config;
  /** Registered command name → command ID, filled once registration succeeds. */
  commandIds: Map<string, string>;
}

export interface SlashCommand {
  data: RESTPostAPIChatInputApplicationCommandsJSONBody;
  /** Registered for every server the bot is in, not just config.guildId. */
  global?: true;
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
  /** Heading in /help, e.g. "🏁 Motorsport". */
  title?: string;
  /** Extra /help line for behaviour that isn't a command. */
  helpNote?: string;
  commands?: SlashCommand[];
  components?: ComponentHandler[];
  events?: EventHandler[];
  jobs?: Job[];
  migrations?: Migration[];
}

export interface ProcessLike {
  on(event: "unhandledRejection" | "uncaughtException", listener: (err: unknown) => void): unknown;
  exit(code: number): void;
}

export interface Router {
  command(name: string): SlashCommand | undefined;
  component(customId: string): { handler: ComponentHandler; args: string[] } | undefined;
  commands: SlashCommand[];
}
