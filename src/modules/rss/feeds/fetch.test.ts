import { describe, expect, test } from "bun:test";
import type { FetchFn } from "../../../core/guards.ts";
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
    const text = await fetchFeed("https://93.184.216.34/rss", async (_url, i) => {
      init = i;
      return new Response("<rss/>");
    });
    expect(text).toBe("<rss/>");
    expect(init?.signal).toBeInstanceOf(AbortSignal);
    expect(new Headers(init?.headers).get("user-agent")).toContain("Gork");
  });

  test("fails on a non-OK status", async () => {
    const err = await failure(
      fetchFeed("https://93.184.216.34/rss", async () => new Response("", { status: 404 })),
    );
    expect(err).toBeInstanceOf(FeedError);
    expect(String(err)).toContain("404");
  });

  test("fails on a network error", async () => {
    expect(await failure(fetchFeed("https://93.184.216.34/rss", refused))).toBeInstanceOf(
      FeedError,
    );
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
      fetchFeed("https://93.184.216.34/rss", async () => new Response(endless)),
    );
    expect(err).toBeInstanceOf(FeedError);
    expect(pulled).toBeLessThan(MAX_FEED_BYTES / chunk.length + 3);
  });
});

const publicDns = async () => ["93.184.216.34"];
const lanDns = async () => ["192.168.1.224"];
const ok: FetchFn = async () => new Response("<rss/>");
const toLoopback: FetchFn = async (url) =>
  url.startsWith("https://good.example")
    ? new Response(null, { status: 302, headers: { location: "http://127.0.0.1/admin" } })
    : new Response("<rss/>");
const toHttps: FetchFn = async (url) =>
  url.startsWith("http://")
    ? new Response(null, { status: 301, headers: { location: "https://good.example/rss" } })
    : new Response("<rss>ok</rss>");

describe("fetchFeed host safety", () => {
  test("refuses internal hosts by name, literal address and resolution", async () => {
    for (const url of [
      "http://jev:8017/health",
      "http://localhost/x",
      "http://127.0.0.1/",
      "http://192.168.1.1/",
      "http://10.0.0.5/",
      "http://[::1]/",
      "http://169.254.169.254/",
    ]) {
      expect(await failure(fetchFeed(url, ok, publicDns))).toBeInstanceOf(FeedError);
    }
    expect(await failure(fetchFeed("https://sneaky.example/rss", ok, lanDns))).toBeInstanceOf(
      FeedError,
    );
  });

  test("checks every redirect hop", async () => {
    expect(
      await failure(fetchFeed("https://good.example/rss", toLoopback, publicDns)),
    ).toBeInstanceOf(FeedError);
    expect(await fetchFeed("http://good.example/rss", toHttps, publicDns)).toBe("<rss>ok</rss>");
  });
});
