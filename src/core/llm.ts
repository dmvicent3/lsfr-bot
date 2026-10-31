import { readReply, wireMessage, wireTool } from "./llm-wire.ts";
import type { ChatMessage, LlmOptions, ToolCall } from "./llm-types.ts";
import type { Turn } from "./types.ts";

export class LlmError extends Error {
  override name = "LlmError";
}

const TIMEOUT_MS = 120_000;

/** Visible text only: a closed `<think>` block, or an unclosed one cut off by the token cap, goes. */
export const stripThinking = (text: string): string =>
  text
    .replaceAll(/<think>[\s\S]*?<\/think>/g, "")
    .replace(/<think>[\s\S]*$/, "")
    .trim();

function turnMessage(t: Turn): ChatMessage {
  if (t.role === "model") return { role: "assistant", content: t.text };

  return t.images?.length
    ? { role: "user", content: t.text, images: t.images }
    : { role: "user", content: t.text };
}

/** One prompt, or a conversation (oldest first, ending with the user's turn), as chat messages. */
export function toMessages(prompt: string | Turn[], system?: string): ChatMessage[] {
  const turns: Turn[] = typeof prompt === "string" ? [{ role: "user", text: prompt }] : prompt;
  const head: ChatMessage[] = system ? [{ role: "system", content: system }] : [];

  return [...head, ...turns.map(turnMessage)];
}

async function post(body: unknown, opts: LlmOptions): Promise<Response> {
  try {
    return await (opts.fetchFn ?? fetch)(`${opts.url}/v1/chat/completions`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(opts.timeoutMs ?? TIMEOUT_MS),
    });
  } catch (err) {
    throw new LlmError(`model unreachable: ${String(err)}`);
  }
}

/** One chat-completions round on the local model; thinking is off (the probe's switch). */
export async function chat(
  messages: ChatMessage[],
  opts: LlmOptions,
): Promise<{ content: string; toolCalls: ToolCall[] }> {
  const body = {
    messages: messages.map(wireMessage),
    temperature: 0.3,
    max_tokens: 1024,
    chat_template_kwargs: { enable_thinking: false },
    ...(opts.tools?.length ? { tools: opts.tools.map(wireTool) } : {}),
  };
  const res = await post(body, opts);

  if (!res.ok) throw new LlmError(`model returned ${res.status}: ${await res.text()}`);

  return readReply(await res.json());
}

/** A plain answer, no tools: the visible text, or LlmError when there is none. */
export async function generate(
  prompt: string | Turn[],
  opts: LlmOptions & { system?: string },
): Promise<string> {
  const { content } = await chat(toMessages(prompt, opts.system), { ...opts, tools: [] });
  const text = stripThinking(content);

  if (!text) throw new LlmError("model returned no text");

  return text;
}
