import type { FetchFn, InlineImage } from "./types.ts";

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
  /** An overall deadline across several calls (one chat reply); aborts this call too. */
  signal?: AbortSignal;
}
