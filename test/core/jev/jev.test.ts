import { describe, expect, test } from "bun:test";
import { isRecord } from "../../../src/core/guards.ts";
import type { FetchFn } from "../../../src/core/types.ts";
import { JevError, postYesNo } from "../../../src/core/jev/http.ts";
import { createJev } from "../../../src/core/jev/queue.ts";

const Q = [
  { key: "r1", instructions: "Is this article about sports?" },
  { key: "r2", instructions: "Is it an ad?" },
];

function failure(p: Promise<unknown>): Promise<unknown> {
  return p.then(
    () => null,
    (err: unknown) => err,
  );
}

const down: FetchFn = async () => {
  throw new TypeError("connection refused");
};

function completion(pYes: number | null): unknown {
  const top = [{ token: "0", prob: 1 - (pYes ?? 0) }];
  if (pYes !== null) top.unshift({ token: "1", prob: pYes });
  return { content: "1", completion_probabilities: [{ token: "1", top_probs: top }] };
}

function reply(status: number, body: unknown): FetchFn {
  return async () => new Response(JSON.stringify(body), { status });
}

function bodyOf(init: RequestInit | undefined): Record<string, unknown> {
  const body: unknown = typeof init?.body === "string" ? JSON.parse(init.body) : null;
  return isRecord(body) ? body : {};
}

describe("postYesNo", () => {
  test("asks each question in turn with jev's prompt and reads P(token 1)", async () => {
    const calls: { url: string; body: Record<string, unknown> }[] = [];
    const answers = await postYesNo("http://jev:8017", "Title\n\nBody", Q, async (url, init) => {
      calls.push({ url, body: bodyOf(init) });
      expect(init?.signal).toBeInstanceOf(AbortSignal);
      return new Response(JSON.stringify(completion(calls.length === 1 ? 0.93 : 0.1)));
    });
    expect(calls.map((c) => c.url)).toEqual([
      "http://jev:8017/completion",
      "http://jev:8017/completion",
    ]);
    expect(calls[0]?.body).toEqual({
      prompt:
        "<evidence>\nTitle\n\nBody\n</evidence>\n\nQuestion: Is this article about sports?\nAnswer:",
      n_predict: 1,
      grammar: "root ::= [01]",
      temperature: 1,
      top_k: 0,
      top_p: 1,
      min_p: 0,
      n_probs: 2,
      post_sampling_probs: true,
      cache_prompt: true,
    });
    expect(calls[1]?.body["prompt"]).toEndWith("Question: Is it an ad?\nAnswer:");
    expect(answers).toEqual(
      new Map([
        ["r1", 0.93],
        ["r2", 0.1],
      ]),
    );
  });

  test("reads a missing token 1 as P(yes) = 0", async () => {
    const answers = await postYesNo("http://jev", "s", [Q[0]!], reply(200, completion(null)));
    expect(answers.get("r1")).toBe(0);
  });

  test("cuts the state to 1,500 characters", async () => {
    let prompt = "";
    await postYesNo("http://jev", "x".repeat(2000), [Q[0]!], async (_u, init) => {
      const p = bodyOf(init)["prompt"];
      prompt = typeof p === "string" ? p : "";
      return new Response(JSON.stringify(completion(0.5)));
    });
    expect(prompt).toContain(`\n${"x".repeat(1500)}\n</evidence>`);
    expect(prompt).not.toContain("x".repeat(1501));
  });

  test("rejects a non-OK status", async () => {
    expect(await failure(postYesNo("http://jev", "s", Q, reply(503, {})))).toBeInstanceOf(JevError);
  });

  test("rejects a body without probabilities", async () => {
    expect(
      await failure(postYesNo("http://jev", "s", Q, reply(200, { content: "1" }))),
    ).toBeInstanceOf(JevError);
  });

  test("rejects a probability outside 0..1", async () => {
    expect(
      await failure(postYesNo("http://jev", "s", Q, reply(200, completion(1.5)))),
    ).toBeInstanceOf(JevError);
  });

  test("wraps a network failure", async () => {
    expect(await failure(postYesNo("http://jev", "s", Q, down))).toBeInstanceOf(JevError);
  });
});

function clock() {
  const c = {
    t: 0,
    slept: [] as number[],
    now: () => c.t,
    sleep: async (ms: number) => {
      c.slept.push(ms);
      c.t += ms;
    },
  };
  return c;
}

const ONE = [{ key: "r1", instructions: "q" }];

describe("createJev", () => {
  test("sends one request at a time, in call order", async () => {
    const c = clock();
    let inFlight = 0;
    let most = 0;
    const order: string[] = [];
    const jev = createJev({
      url: "http://jev",
      now: c.now,
      sleep: c.sleep,
      fetchFn: async (_u, init) => {
        inFlight++;
        most = Math.max(most, inFlight);
        order.push(String(bodyOf(init)["prompt"]).split("\n")[1] ?? "");
        await Bun.sleep(1);
        inFlight--;
        return new Response(JSON.stringify(completion(0.5)));
      },
    });
    await Promise.all(["a", "b", "c"].map((s) => jev.yesNo(s, ONE)));
    expect(most).toBe(1);
    expect(order).toEqual(["a", "b", "c"]);
  });

  test("keeps a second between article requests", async () => {
    const c = clock();
    const jev = createJev({
      url: "http://jev",
      now: c.now,
      sleep: c.sleep,
      fetchFn: reply(200, completion(0.5)),
    });
    await jev.yesNo("a", ONE);
    c.t += 300;
    await jev.yesNo("b", ONE);
    expect(c.slept).toEqual([700]);
  });

  test("backs off after failures: 1, 2, 4, 8, 15, 15 minutes, failing fast in between", async () => {
    const c = clock();
    let calls = 0;
    const jev = createJev({
      url: "http://jev",
      now: c.now,
      sleep: c.sleep,
      fetchFn: async () => {
        calls++;
        return new Response("{}", { status: 503 });
      },
    });
    const pauses = [60, 120, 240, 480, 900, 900].map((m) => m * 1000);
    for (const pause of pauses) {
      const before = calls;
      expect(await failure(jev.yesNo("s", ONE))).toBeInstanceOf(JevError);
      expect(calls).toBe(before + 1);
      c.t += pause - 1;
      expect(await failure(jev.yesNo("s", ONE))).toBeInstanceOf(JevError);
      expect(calls).toBe(before + 1);
      c.t += 1;
    }
  });

  test("a success clears the back-off", async () => {
    const c = clock();
    let fail = true;
    const jev = createJev({
      url: "http://jev",
      now: c.now,
      sleep: c.sleep,
      fetchFn: async () =>
        fail ? new Response("{}", { status: 503 }) : new Response(JSON.stringify(completion(0.5))),
    });
    expect(await failure(jev.yesNo("s", ONE))).toBeInstanceOf(JevError);
    c.t += 60_000;
    fail = false;
    expect((await jev.yesNo("s", ONE)).get("r1")).toBe(0.5);
    fail = true;
    c.t += 1_000;
    expect(await failure(jev.yesNo("s", ONE))).toBeInstanceOf(JevError);
    c.t += 60_000;
    fail = false;
    expect((await jev.yesNo("s", ONE)).get("r1")).toBe(0.5);
  });
});
