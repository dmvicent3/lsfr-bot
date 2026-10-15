import { describe, expect, test } from "bun:test";
import type { FetchFn } from "./guards.ts";
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
