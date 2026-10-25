import { describe, expect, test } from "bun:test";
import type { FetchFn } from "./types.ts";
import { generate, LlmError } from "./llm.ts";

function fakeFetch(status: number, body: unknown, seen?: { url?: string; key?: string | null }) {
  const fn: FetchFn = async (url, init) => {
    if (seen) {
      seen.url = url;
      seen.key = new Headers(init?.headers).get("x-goog-api-key");
    }
    return new Response(JSON.stringify(body), { status });
  };
  return fn;
}

describe("generate", () => {
  test("posts to the model endpoint and joins the text parts", async () => {
    const seen: { url?: string; key?: string | null } = {};
    const body = { candidates: [{ content: { parts: [{ text: "a" }, { text: "b" }] } }] };
    const text = await generate("hi", {
      apiKey: "k",
      model: "m1",
      fetchFn: fakeFetch(200, body, seen),
    });
    expect(text).toBe("ab");
    expect(seen.url?.endsWith("/models/m1:generateContent")).toBe(true);
    expect(seen.key).toBe("k");
  });

  test("sends a conversation as Gemini contents", async () => {
    let sent: unknown;
    await generate(
      [
        { role: "user", text: "A" },
        { role: "model", text: "B" },
        { role: "user", text: "what did I type?" },
      ],
      {
        apiKey: "k",
        model: "m",
        fetchFn: async (_url, init) => {
          sent = typeof init?.body === "string" ? JSON.parse(init.body) : null;
          return new Response(
            JSON.stringify({ candidates: [{ content: { parts: [{ text: "A" }] } }] }),
          );
        },
      },
    );
    expect(sent).toEqual({
      contents: [
        { role: "user", parts: [{ text: "A" }] },
        { role: "model", parts: [{ text: "B" }] },
        { role: "user", parts: [{ text: "what did I type?" }] },
      ],
    });
  });

  test("rejects on a non-OK status", async () => {
    const err = await generate("hi", {
      apiKey: "k",
      model: "m",
      fetchFn: fakeFetch(404, {}),
    }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(LlmError);
  });

  test("rejects when there is no text", async () => {
    const err = await generate("hi", {
      apiKey: "k",
      model: "m",
      fetchFn: fakeFetch(200, { candidates: [] }),
    }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(LlmError);
  });
});

test("LLM requests time out", async () => {
  let signal: AbortSignal | null | undefined;
  await generate("hi", {
    apiKey: "k",
    model: "m",
    fetchFn: async (_url, init) => {
      signal = init?.signal;
      return new Response(
        JSON.stringify({ candidates: [{ content: { parts: [{ text: "a" }] } }] }),
      );
    },
  });
  expect(signal).toBeInstanceOf(AbortSignal);
});

test("sends the system instruction and inline images", async () => {
  let sent: unknown;
  await generate(
    [{ role: "user", text: "what is this?", images: [{ mimeType: "image/png", data: "QUJD" }] }],
    {
      apiKey: "k",
      model: "m",
      system: "You are Gork.",
      fetchFn: async (_url, init) => {
        sent = typeof init?.body === "string" ? JSON.parse(init.body) : null;
        return new Response(
          JSON.stringify({ candidates: [{ content: { parts: [{ text: "a" }] } }] }),
        );
      },
    },
  );
  expect(sent).toEqual({
    system_instruction: { parts: [{ text: "You are Gork." }] },
    contents: [
      {
        role: "user",
        parts: [
          { text: "what is this?" },
          { inline_data: { mime_type: "image/png", data: "QUJD" } },
        ],
      },
    ],
  });
});
