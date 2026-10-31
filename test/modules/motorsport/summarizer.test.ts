import { expect, test } from "bun:test";
import { LlmError } from "../../../src/core/llm.ts";
import { summarizer } from "../../../src/modules/motorsport/jobs.ts";

test("without a local model every summary fails, so rulings post without one", async () => {
  expect(summarizer(null)("Summarise this")).rejects.toBeInstanceOf(LlmError);
});

test("a model that's still loading fails the summary the same way", async () => {
  const realFetch = globalThis.fetch;
  globalThis.fetch = Object.assign(async () => new Response("loading model", { status: 503 }), {
    preconnect: realFetch.preconnect,
  });

  try {
    expect(summarizer("http://llm:8019")("Summarise this")).rejects.toThrow("model returned 503");
  } finally {
    globalThis.fetch = realFetch;
  }
});
