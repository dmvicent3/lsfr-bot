import { beforeEach, describe, expect, test } from "bun:test";
import { createClient, MangaDexError } from "../../../../src/modules/manga/api/client.ts";

let clock: number;
let sleeps: number[];
let requests: { url: string; init: RequestInit | undefined }[];
let statuses: number[];

beforeEach(() => {
  clock = 0;
  sleeps = [];
  requests = [];
  statuses = [];
});

function failure(p: Promise<unknown>): Promise<unknown> {
  return p.then(
    () => null,
    (err: unknown) => err,
  );
}

const client = () =>
  createClient({
    fetchFn: async (url, init) => {
      requests.push({ url, init });
      const status = statuses.shift() ?? 200;

      return new Response(JSON.stringify({ status }), { status });
    },
    sleep: async (ms) => void sleeps.push(ms),
    now: () => clock,
    retryDelayMs: 0,
  });

describe("createClient", () => {
  test("repeats array params and sends the user agent", async () => {
    const get = client();
    expect(await get("/manga", { "ids[]": ["a", "b"], limit: "100" })).toEqual({ status: 200 });
    expect(requests[0]?.url).toBe(
      "https://api.mangadex.org/manga?ids%5B%5D=a&ids%5B%5D=b&limit=100",
    );
    expect(new Headers(requests[0]?.init?.headers).get("user-agent")).toBe("Gork (Discord bot)");
  });

  test("spaces calls 250 ms apart", async () => {
    const get = client();
    await get("/a", {});
    clock = 10;
    await get("/b", {});
    expect(sleeps).toEqual([240]);
  });

  test("retries a 503 and returns the next answer", async () => {
    statuses = [503, 200];
    expect(await client()("/a", {})).toEqual({ status: 200 });
    expect(requests).toHaveLength(2);
  });

  test("gives up after three failures", async () => {
    statuses = [429, 429, 429];
    expect(await failure(client()("/a", {}))).toBeInstanceOf(MangaDexError);
  });

  test("a 400 is a MangaDexError, not retried", async () => {
    statuses = [400, 200];
    const err = await failure(client()("/a", {}));
    expect(err).toBeInstanceOf(MangaDexError);
    expect(err).toMatchObject({ message: "HTTP 400", status: 400 });
    expect(requests).toHaveLength(1);
  });
});
