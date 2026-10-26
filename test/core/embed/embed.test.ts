import { describe, expect, test } from "bun:test";
import { EmbedError, createEmbedder } from "../../../src/core/embed/http.ts";
import type { FetchFn } from "../../../src/core/types.ts";

const URL = "http://embed:8018";

function reply(status: number, body: unknown): FetchFn {
  return async () => new Response(JSON.stringify(body), { status });
}

function failure(p: Promise<unknown>): Promise<unknown> {
  return p.then(
    () => null,
    (err: unknown) => err,
  );
}

const close = (v: Float32Array, expected: number[]) =>
  expect([...v].map((x) => Math.round(x * 1e6) / 1e6)).toEqual(expected);

describe("createEmbedder", () => {
  test("posts the text to /embedding and returns the vector normalized", async () => {
    const calls: { url: string; body: unknown }[] = [];

    const fetchFn: FetchFn = async (url, init) => {
      calls.push({ url, body: JSON.parse(String(init?.body)) });

      return new Response(JSON.stringify([{ index: 0, embedding: [[3, 4]] }]));
    };

    close(await createEmbedder({ url: URL, fetchFn }).embed("hi"), [0.6, 0.8]);
    expect(calls).toEqual([{ url: `${URL}/embedding`, body: { content: "hi" } }]);
  });

  test("accepts a flat embedding array", async () => {
    const embedder = createEmbedder({ url: URL, fetchFn: reply(200, [{ embedding: [3, 4] }]) });
    close(await embedder.embed("hi"), [0.6, 0.8]);
  });

  test("throws EmbedError when unreachable", async () => {
    const fetchFn: FetchFn = async () => {
      throw new TypeError("connection refused");
    };

    expect(await failure(createEmbedder({ url: URL, fetchFn }).embed("hi"))).toBeInstanceOf(
      EmbedError,
    );
  });

  test("throws EmbedError on invalid JSON", async () => {
    const fetchFn: FetchFn = async () => new Response("not json");
    expect(await failure(createEmbedder({ url: URL, fetchFn }).embed("hi"))).toBeInstanceOf(
      EmbedError,
    );
  });

  const bad: [string, number, unknown][] = [
    ["a 500", 500, [{ embedding: [1] }]],
    ["no results", 200, []],
    ["an empty vector", 200, [{ embedding: [] }]],
    ["a non-numeric vector", 200, [{ embedding: ["x"] }]],
    ["an all-zero vector", 200, [{ embedding: [0, 0] }]],
  ];

  for (const [name, status, body] of bad) {
    test(`throws EmbedError on ${name}`, async () => {
      const embedder = createEmbedder({ url: URL, fetchFn: reply(status, body) });
      expect(await failure(embedder.embed("hi"))).toBeInstanceOf(EmbedError);
    });
  }
});
