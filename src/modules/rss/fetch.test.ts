import { describe, expect, test } from "bun:test";
import type { FetchFn } from "../../core/guards.ts";
import { fetchFeed, MAX_FEED_BYTES } from "./fetch.ts";
import { FeedError } from "./parse.ts";

function failure(p: Promise<unknown>): Promise<unknown> {
  return p.then(
    () => null,
    (err: unknown) => err,
  );
}

const refused: FetchFn = async () => {
  throw new TypeError("connection refused");
};

describe("fetchFeed", () => {
  test("returns the body, sending a timeout and a user agent", async () => {
    let init: RequestInit | undefined;
    const text = await fetchFeed("https://a.example/rss", async (_url, i) => {
      init = i;
      return new Response("<rss/>");
    });
    expect(text).toBe("<rss/>");
    expect(init?.signal).toBeInstanceOf(AbortSignal);
    expect(new Headers(init?.headers).get("user-agent")).toContain("Gork");
  });

  test("fails on a non-OK status", async () => {
    const err = await failure(
      fetchFeed("https://a.example/rss", async () => new Response("", { status: 404 })),
    );
    expect(err).toBeInstanceOf(FeedError);
    expect(String(err)).toContain("404");
  });

  test("fails on a network error", async () => {
    expect(await failure(fetchFeed("https://a.example/rss", refused))).toBeInstanceOf(FeedError);
  });

  test("stops reading past the size cap", async () => {
    let pulled = 0;
    const chunk = new Uint8Array(500_000);
    const endless = new ReadableStream<Uint8Array>({
      pull(controller) {
        pulled++;
        controller.enqueue(chunk);
      },
    });
    const err = await failure(
      fetchFeed("https://a.example/rss", async () => new Response(endless)),
    );
    expect(err).toBeInstanceOf(FeedError);
    expect(pulled).toBeLessThan(MAX_FEED_BYTES / chunk.length + 3);
  });
});
