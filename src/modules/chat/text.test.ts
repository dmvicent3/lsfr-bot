import { describe, expect, test } from "bun:test";
import {
  buildConversation,
  type ChainMessage,
  collectChain,
  MAX_CHAIN,
  splitMessage,
  stripMentions,
} from "./text.ts";

test("stripMentions removes user mentions", () => {
  expect(stripMentions("<@1> hi <@!2>")).toBe("hi");
});

const user = (text: string, author = "12x"): ChainMessage => ({ fromBot: false, author, text });
const bot = (text: string): ChainMessage => ({ fromBot: true, author: "Gork", text });

describe("buildConversation", () => {
  test("a single mention is one user turn", () => {
    expect(buildConversation([user("<@9> A")])).toEqual([{ role: "user", text: "12x: A" }]);
  });

  test("a reply chain alternates user and model turns", () => {
    expect(
      buildConversation([
        user("<@9> A"),
        bot("B! Just kidding"),
        user("<@9> what letter did I type?"),
      ]),
    ).toEqual([
      { role: "user", text: "12x: A" },
      { role: "model", text: "B! Just kidding" },
      { role: "user", text: "12x: what letter did I type?" },
    ]);
  });

  test("consecutive messages from people merge into one turn", () => {
    expect(buildConversation([user("the sky is blue", "ana"), user("<@9> why?")])).toEqual([
      { role: "user", text: "ana: the sky is blue\n12x: why?" },
    ]);
  });

  test("a chain starting with the bot gets a user turn first", () => {
    expect(buildConversation([bot("hello"), user("<@9> hi")])).toEqual([
      { role: "user", text: "(earlier conversation)" },
      { role: "model", text: "hello" },
      { role: "user", text: "12x: hi" },
    ]);
  });

  test("empty messages are skipped", () => {
    expect(buildConversation([user(""), user("<@9> hi")])).toEqual([
      { role: "user", text: "12x: hi" },
    ]);
  });
});

interface Fake {
  id: number;
  parent: number | null;
}

const parentIn =
  (all: Map<number, Fake>) =>
  async (m: Fake): Promise<Fake | null> =>
    m.parent === null ? null : (all.get(m.parent) ?? null);

const unreachable = async (): Promise<Fake | null> => {
  throw new Error("deleted");
};

describe("collectChain", () => {
  test("walks replies back, oldest first", async () => {
    const all = new Map<number, Fake>([
      [1, { id: 1, parent: null }],
      [2, { id: 2, parent: 1 }],
      [3, { id: 3, parent: 2 }],
    ]);
    const chain = await collectChain({ id: 3, parent: 2 }, parentIn(all));
    expect(chain.map((m) => m.id)).toEqual([1, 2, 3]);
  });

  test("stops at the limit, keeping the newest", async () => {
    const all = new Map<number, Fake>();
    for (let i = 1; i <= 30; i++) all.set(i, { id: i, parent: i > 1 ? i - 1 : null });
    const chain = await collectChain({ id: 30, parent: 29 }, parentIn(all));
    expect(chain).toHaveLength(MAX_CHAIN);
    expect(chain.at(-1)?.id).toBe(30);
  });

  test("a parent that can't be fetched ends the chain", async () => {
    const start = { id: 2, parent: 1 };
    expect(await collectChain(start, unreachable)).toEqual([start]);
  });
});

describe("splitMessage", () => {
  test("hard-splits long lines at the limit", () => {
    expect(splitMessage("a".repeat(4500)).map((c) => c.length)).toEqual([2000, 2000, 500]);
  });

  test("prefers the last newline inside the limit", () => {
    const chunks = splitMessage(`${"x".repeat(1990)}\n${"y".repeat(100)}`);
    expect(chunks).toHaveLength(2);
    expect(chunks[0]).toBe("x".repeat(1990));
    expect(chunks[1]).toBe("y".repeat(100));
  });

  test("empty text gives no chunks", () => expect(splitMessage("")).toEqual([]));
});
