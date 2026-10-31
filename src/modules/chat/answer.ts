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

/** The query of a usable web_search call; null for an unknown tool or a missing query. */
function queryOf(c: ToolCall): string | null {
  const query = c.arguments["query"];
  const ok = c.name === WEB_SEARCH.name && typeof query === "string" && query.trim() !== "";

  return ok ? query : null;
}

/** One tool message per call; searches stop at MAX_SEARCHES for the whole reply. */
async function answerCalls(calls: ToolCall[], d: AnswerDeps, used: number) {
  const messages: ChatMessage[] = [];
  let searched = used;

  for (const c of calls) {
    const query = queryOf(c);
    let text = "No results.";

    if (query && searched >= MAX_SEARCHES) text = "Search limit reached.";

    if (query && searched < MAX_SEARCHES) {
      text = await d.search(query);
      searched++;
    }

    messages.push({ role: "tool", toolCallId: c.id, content: text });
  }

  return { messages, searched };
}

/**
 * The model's answer to a conversation, letting it search the web up to MAX_SEARCHES times;
 * once they are used it is asked without tools so it has to answer.
 */
export async function answerWithSearch(messages: ChatMessage[], d: AnswerDeps): Promise<string> {
  const thread = [...messages];
  let used = 0;

  for (;;) {
    const tools = d.canSearch && used < MAX_SEARCHES ? [WEB_SEARCH] : [];
    const { content, toolCalls } = await d.ask(thread, tools);

    if (tools.length === 0 || toolCalls.length === 0) {
      const text = stripThinking(content);

      if (!text) throw new LlmError("model returned no text");

      return text;
    }

    const answered = await answerCalls(toolCalls, d, used);
    thread.push({ role: "assistant", content, toolCalls }, ...answered.messages);
    used = answered.searched;
  }
}
