import { expect, test } from "bun:test";
import type { ChatMessage, ToolCall, ToolSpec } from "../../../src/core/llm-types.ts";
import { answerWithSearch } from "../../../src/modules/chat/answer.ts";

type Reply = { content: string; toolCalls: ToolCall[] };

const call = (query: unknown, name = "web_search"): ToolCall => ({
  id: `c-${String(query)}`,
  name,
  arguments: { query },
});

/** A fake model that gives `replies` in order, recording what it was asked. */
function model(replies: Reply[]) {
  const asks: { messages: ChatMessage[]; tools: ToolSpec[] }[] = [];

  const ask = async (messages: ChatMessage[], tools: ToolSpec[]) => {
    asks.push({ messages: [...messages], tools });

    return replies[asks.length - 1] ?? { content: "out of replies", toolCalls: [] };
  };

  return { ask, asks };
}

const searches: string[] = [];

const search = async (q: string) => {
  searches.push(q);

  return `results for ${q}`;
};

const USER: ChatMessage[] = [{ role: "user", content: "ana: news?" }];

test("no tool call: the answer comes straight back, nothing searched", async () => {
  searches.length = 0;
  const m = model([{ content: "<think>x</think>Hi", toolCalls: [] }]);
  expect(await answerWithSearch(USER, { ask: m.ask, search, canSearch: true })).toBe("Hi");
  expect(searches).toEqual([]);
  expect(m.asks[0]?.tools.map((t) => t.name)).toEqual(["web_search"]);
});

test("one search, then the answer sees the call and its results", async () => {
  searches.length = 0;
  const m = model([
    { content: "", toolCalls: [call("f1 result")] },
    { content: "Norris won <https://a>", toolCalls: [] },
  ]);
  expect(await answerWithSearch(USER, { ask: m.ask, search, canSearch: true })).toBe(
    "Norris won <https://a>",
  );
  expect(searches).toEqual(["f1 result"]);
  expect(m.asks[1]?.messages.slice(1)).toEqual([
    { role: "assistant", content: "", toolCalls: [call("f1 result")] },
    { role: "tool", toolCallId: "c-f1 result", content: "results for f1 result" },
  ]);
});

test("a model that keeps searching gets two rounds, then must answer", async () => {
  searches.length = 0;
  const m = model([
    { content: "", toolCalls: [call("a")] },
    { content: "", toolCalls: [call("b")] },
    { content: "done", toolCalls: [] },
  ]);
  expect(await answerWithSearch(USER, { ask: m.ask, search, canSearch: true })).toBe("done");
  expect(searches).toEqual(["a", "b"]);
  expect(m.asks.map((a) => a.tools.length)).toEqual([1, 1, 0]);
});

test("an unknown tool or a missing query gets 'No results.' and no search", async () => {
  searches.length = 0;
  const m = model([
    { content: "", toolCalls: [call(undefined), call("x", "weather")] },
    { content: "ok", toolCalls: [] },
  ]);
  await answerWithSearch(USER, { ask: m.ask, search, canSearch: true });
  expect(searches).toEqual([]);
  expect(m.asks[1]?.messages.filter((x) => x.role === "tool").map((x) => x.content)).toEqual([
    "No results.",
    "No results.",
  ]);
});

test("without search the model is asked once with no tools", async () => {
  const m = model([{ content: "plain", toolCalls: [] }]);
  expect(await answerWithSearch(USER, { ask: m.ask, search, canSearch: false })).toBe("plain");
  expect(m.asks.map((a) => a.tools.length)).toEqual([0]);
});

test("an empty final answer is an error", async () => {
  const m = model([{ content: "<think>only</think>", toolCalls: [] }]);
  expect(answerWithSearch(USER, { ask: m.ask, search, canSearch: true })).rejects.toThrow(
    "model returned no text",
  );
});
