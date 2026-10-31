import { describe, expect, test } from "bun:test";
import { chat, generate, LlmError, stripThinking, toMessages } from "../../src/core/llm.ts";
import type { ToolSpec } from "../../src/core/llm-types.ts";
import type { FetchFn } from "../../src/core/types.ts";

/** Answers with `body` and records what was posted. */
function fakeFetch(status: number, body: unknown, seen: { url?: string; body?: unknown } = {}) {
  const fn: FetchFn = async (url, init) => {
    seen.url = url;
    seen.body = typeof init?.body === "string" ? JSON.parse(init.body) : null;

    return new Response(JSON.stringify(body), { status });
  };

  return fn;
}

const reply = (message: Record<string, unknown>) => ({ choices: [{ message }] });

const answering = (content: string) => ({ url: "u", fetchFn: fakeFetch(200, reply({ content })) });

const down: FetchFn = async () => {
  throw new TypeError("connection refused");
};

const TOOL: ToolSpec = {
  name: "web_search",
  description: "Search.",
  parameters: { type: "object", properties: { query: { type: "string" } } },
};

describe("generate", () => {
  test("posts the conversation as chat messages, images as data URIs", async () => {
    const seen: { url?: string; body?: unknown } = {};
    const text = await generate(
      [
        { role: "user", text: "A" },
        { role: "model", text: "B" },
        { role: "user", text: "what is this?", images: [{ mimeType: "image/png", data: "QUJD" }] },
      ],
      {
        url: "http://llm:8019",
        system: "Be Gork.",
        fetchFn: fakeFetch(200, reply({ content: "ok" }), seen),
      },
    );
    expect(text).toBe("ok");
    expect(seen.url).toBe("http://llm:8019/v1/chat/completions");
    expect(seen.body).toEqual({
      messages: [
        { role: "system", content: "Be Gork." },
        { role: "user", content: "A" },
        { role: "assistant", content: "B" },
        {
          role: "user",
          content: [
            { type: "text", text: "what is this?" },
            { type: "image_url", image_url: { url: "data:image/png;base64,QUJD" } },
          ],
        },
      ],
      temperature: 0.3,
      max_tokens: 1024,
      chat_template_kwargs: { enable_thinking: false },
    });
  });

  test("an image with no text sends only the image part", async () => {
    const seen: { body?: unknown } = {};
    const turns = [
      { role: "user" as const, text: "", images: [{ mimeType: "image/jpeg", data: "x" }] },
    ];
    await generate(turns, { url: "u", fetchFn: fakeFetch(200, reply({ content: "ok" }), seen) });
    expect(seen.body).toMatchObject({
      messages: [
        {
          role: "user",
          content: [{ type: "image_url", image_url: { url: "data:image/jpeg;base64,x" } }],
        },
      ],
    });
    expect(toMessages("hi")).toEqual([{ role: "user", content: "hi" }]);
  });

  test("thinking is stripped, and a reply of only thinking is an error", async () => {
    expect(await generate("hi", answering("<think>hmm</think>Hello"))).toBe("Hello");
    expect(generate("hi", answering("<think>cut off"))).rejects.toThrow(LlmError);
    expect(generate("hi", answering(""))).rejects.toThrow("model returned no text");
  });

  test("errors and failed requests become LlmError", async () => {
    expect(
      generate("hi", { url: "u", fetchFn: fakeFetch(503, { error: "loading" }) }),
    ).rejects.toThrow("model returned 503");
    expect(generate("hi", { url: "u", fetchFn: down })).rejects.toThrow(LlmError);
  });
});

describe("chat", () => {
  test("offers tools and sends tool calls and results back in OpenAI shape", async () => {
    const seen: { body?: unknown } = {};
    await chat(
      [
        { role: "user", content: "news?" },
        {
          role: "assistant",
          content: "",
          toolCalls: [{ id: "c1", name: "web_search", arguments: { query: "x" } }],
        },
        { role: "tool", toolCallId: "c1", content: "No results." },
      ],
      { url: "u", tools: [TOOL], fetchFn: fakeFetch(200, reply({ content: "done" }), seen) },
    );
    expect(seen.body).toMatchObject({
      messages: [
        { role: "user", content: "news?" },
        {
          role: "assistant",
          content: "",
          tool_calls: [
            {
              id: "c1",
              type: "function",
              function: { name: "web_search", arguments: '{"query":"x"}' },
            },
          ],
        },
        { role: "tool", tool_call_id: "c1", content: "No results." },
      ],
      tools: [{ type: "function", function: TOOL }],
    });
  });

  test("reads tool calls; arguments that aren't JSON become {}", async () => {
    const body = reply({
      content: null,
      tool_calls: [
        {
          id: "a",
          type: "function",
          function: { name: "web_search", arguments: '{"query":"f1"}' },
        },
        { id: "b", type: "function", function: { name: "web_search", arguments: "not json" } },
      ],
    });
    expect(
      await chat([{ role: "user", content: "q" }], { url: "u", fetchFn: fakeFetch(200, body) }),
    ).toEqual({
      content: "",
      toolCalls: [
        { id: "a", name: "web_search", arguments: { query: "f1" } },
        { id: "b", name: "web_search", arguments: {} },
      ],
    });
  });
});

test("stripThinking keeps the visible text", () => {
  expect(stripThinking("<think>x</think>Hi")).toBe("Hi");
  expect(stripThinking("Hi<think>cut off")).toBe("Hi");
  expect(stripThinking("  plain  ")).toBe("plain");
});

/** Never answers until its request is aborted. */
const hangs: FetchFn = async (_url, init) =>
  new Promise((_resolve, reject) => {
    init?.signal?.addEventListener("abort", () => reject(new Error("aborted")));
  });

test("a reply's overall deadline aborts the request", async () => {
  const deadline = AbortSignal.timeout(20);
  expect(
    chat([{ role: "user", content: "q" }], { url: "u", fetchFn: hangs, signal: deadline }),
  ).rejects.toThrow(LlmError);
});
