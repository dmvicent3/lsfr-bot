import { describe, expect, test } from "bun:test";
import { type FetchFn, isRecord } from "./guards.ts";
import { JevError, postYesNo } from "./jev.ts";

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
