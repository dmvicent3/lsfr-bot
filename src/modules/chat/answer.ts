import { LlmError, stripThinking } from "../../core/llm.ts";
import type { ChatMessage, ToolCall, ToolSpec } from "../../core/llm-types.ts";
import { MAX_SEARCHES, WEB_SEARCH } from "./tools.ts";

export interface AnswerDeps {
  ask: (
    messages: ChatMessage[],
    tools: ToolSpec[],
  ) => Promise<{ content: string; toolCalls: ToolCall[] }>;
  /** The tool message for a query; never throws ("No results." on failure). */
  search: (query: string) => Promise<string>;
  canSearch: boolean;
}

/** The tool message for one call: a web_search with a text query searches, anything else doesn't. */
async function runCall(c: ToolCall, search: AnswerDeps["search"]): Promise<ChatMessage> {
  const query = c.arguments["query"];
  const ok = c.name === WEB_SEARCH.name && typeof query === "string" && query.trim() !== "";
  const content = ok ? await search(query) : "No results.";

  return { role: "tool", toolCallId: c.id, content };
}

/**
 * The model's answer to a conversation, letting it search the web up to MAX_SEARCHES rounds;
 * after the last round it is asked without tools so it has to answer.
 */
export async function answerWithSearch(messages: ChatMessage[], d: AnswerDeps): Promise<string> {
  const thread = [...messages];

  for (let round = 0; ; round++) {
    const tools = d.canSearch && round < MAX_SEARCHES ? [WEB_SEARCH] : [];
    const { content, toolCalls } = await d.ask(thread, tools);

    if (tools.length === 0 || toolCalls.length === 0) {
      const text = stripThinking(content);

      if (!text) throw new LlmError("model returned no text");

      return text;
    }

    thread.push({ role: "assistant", content, toolCalls });

    for (const c of toolCalls) thread.push(await runCall(c, d.search));
  }
}
