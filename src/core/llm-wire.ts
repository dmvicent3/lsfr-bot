import { isRecord, isString } from "./guards.ts";
import type { ChatMessage, ToolCall, ToolSpec } from "./llm-types.ts";

/** One message as llama-server's OpenAI-style endpoint takes it. */
export function wireMessage(m: ChatMessage): Record<string, unknown> {
  if (m.role === "tool") return { role: "tool", tool_call_id: m.toolCallId, content: m.content };

  if (m.role === "assistant" && m.toolCalls?.length) {
    const calls = m.toolCalls.map((c) => ({
      id: c.id,
      type: "function",
      function: { name: c.name, arguments: JSON.stringify(c.arguments) },
    }));

    return { role: "assistant", content: m.content, tool_calls: calls };
  }

  if (m.role === "user" && m.images?.length) {
    const images = m.images.map((i) => ({
      type: "image_url",
      image_url: { url: `data:${i.mimeType};base64,${i.data}` },
    }));

    return {
      role: "user",
      content: [...(m.content ? [{ type: "text", text: m.content }] : []), ...images],
    };
  }

  return { role: m.role, content: m.content };
}

export const wireTool = (t: ToolSpec) => ({ type: "function", function: t });

function argumentsOf(raw: unknown): Record<string, unknown> {
  if (!isString(raw)) return isRecord(raw) ? raw : {};

  try {
    const parsed: unknown = JSON.parse(raw);

    return isRecord(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function toolCall(raw: unknown, i: number): ToolCall[] {
  if (!isRecord(raw) || !isRecord(raw["function"]) || !isString(raw["function"]["name"])) return [];

  const id = isString(raw["id"]) ? raw["id"] : `call${i}`;

  return [
    { id, name: raw["function"]["name"], arguments: argumentsOf(raw["function"]["arguments"]) },
  ];
}

/** The first choice's text and tool calls; anything malformed reads as empty. */
export function readReply(body: unknown): { content: string; toolCalls: ToolCall[] } {
  const choices = isRecord(body) ? body["choices"] : null;
  const first: unknown = Array.isArray(choices) ? choices[0] : null;
  const message = isRecord(first) && isRecord(first["message"]) ? first["message"] : {};
  const calls = message["tool_calls"];

  return {
    content: isString(message["content"]) ? message["content"] : "",
    toolCalls: Array.isArray(calls) ? calls.flatMap(toolCall) : [],
  };
}
