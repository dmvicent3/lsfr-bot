import { describe, expect, test } from "bun:test";
import type { FetchFn } from "./guards.ts";
import { JevError, postYesNo } from "./jev.ts";

const Q = [
  { key: "r1", instructions: "Is this article about sports?" },
  { key: "r2", instructions: "Is it an ad?" },
];

function reply(status: number, body: unknown): FetchFn {
  return async () => new Response(JSON.stringify(body), { status });
}

const ok = { answers: { r1: { type: "noul", noul: 0.93 }, r2: { type: "noul", noul: 0.1 } } };

describe("postYesNo", () => {
  test("posts the questions in jev's wire format and maps the answers", async () => {
    let url = "";
    let sent: unknown;
    let signal: AbortSignal | null | undefined;
    const answers = await postYesNo("http://jev:8017", "Title\n\nBody", Q, async (u, init) => {
      url = u;
      sent = typeof init?.body === "string" ? JSON.parse(init.body) : null;
      signal = init?.signal;
      return new Response(JSON.stringify(ok));
    });
    expect(url).toBe("http://jev:8017/v1/systemone");
    expect(sent).toEqual({
      model: "jev-latest",
      state: "Title\n\nBody",
      questions: {
        r1: { type: "noul", instructions: "Is this article about sports?" },
        r2: { type: "noul", instructions: "Is it an ad?" },
      },
    });
    expect(signal).toBeInstanceOf(AbortSignal);
    expect(answers).toEqual(
      new Map([
        ["r1", 0.93],
        ["r2", 0.1],
      ]),
    );
  });

  test("cuts the state to 1,500 characters", async () => {
    let state = "";
    await postYesNo("http://jev", "x".repeat(2000), Q, async (_u, init) => {
      state =
        typeof init?.body === "string" ? (JSON.parse(init.body) as { state: string }).state : "";
      return new Response(JSON.stringify(ok));
    });
    expect(state).toHaveLength(1500);
  });

  test("rejects a non-OK status", async () => {
    await expect(postYesNo("http://jev", "s", Q, reply(503, {}))).rejects.toBeInstanceOf(JevError);
  });

  test("rejects a body of the wrong shape", async () => {
    await expect(postYesNo("http://jev", "s", Q, reply(200, { nope: 1 }))).rejects.toBeInstanceOf(
      JevError,
    );
  });

  test("rejects an answer missing a requested key", async () => {
    const partial = { answers: { r1: { type: "noul", noul: 0.5 } } };
    await expect(postYesNo("http://jev", "s", Q, reply(200, partial))).rejects.toBeInstanceOf(
      JevError,
    );
  });

  test("rejects a probability outside 0..1", async () => {
    const bad = { answers: { r1: { noul: 1.5 }, r2: { noul: 0.1 } } };
    await expect(postYesNo("http://jev", "s", Q, reply(200, bad))).rejects.toBeInstanceOf(JevError);
  });

  test("wraps a network failure", async () => {
    const down: FetchFn = async () => {
      throw new TypeError("connection refused");
    };
    await expect(postYesNo("http://jev", "s", Q, down)).rejects.toBeInstanceOf(JevError);
  });
});
