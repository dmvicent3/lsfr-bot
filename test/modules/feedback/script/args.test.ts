import { describe, expect, test } from "bun:test";
import { parseArgs } from "../../../../src/modules/feedback/script/args.ts";
import { USAGE } from "../../../../src/modules/feedback/script/usage.ts";

const words = (line: string) => line.split(" ");
const long = (n: number) => "x".repeat(n);
const hours = (h: string) => parseArgs(["poll", "Q", ...option(2), "--hours", h]);
const option = (n: number) => Array.from({ length: n }, (_, k) => ["--option", `O${k}`]).flat();

describe("list and read", () => {
  test("list: unread by default, --all, --topic", () => {
    expect(parseArgs(["list"])).toEqual({ name: "list", args: { all: false, topic: null } });
    expect(parseArgs(words("list --all --topic word"))).toEqual({
      name: "list",
      args: { all: true, topic: "word" },
    });
    expect(parseArgs(words("list --topic"))).toEqual({ error: "--topic needs a value." });
    expect(parseArgs(words("list --nope"))).toEqual({ error: "Unknown option --nope." });
  });

  test("read: ids or --all", () => {
    expect(parseArgs(words("read 3 4"))).toEqual({ name: "read", args: { ids: [3, 4] } });
    expect(parseArgs(words("read --all"))).toEqual({ name: "read", args: { ids: "all" } });
    expect(parseArgs(["read"])).toHaveProperty("error");
    expect(parseArgs(words("read 3 x"))).toHaveProperty("error");
    expect(parseArgs(words("read 0"))).toHaveProperty("error");
  });

  test("polls and results", () => {
    expect(parseArgs(["polls"])).toEqual({ name: "polls", args: {} });
    expect(parseArgs(words("results 2"))).toEqual({ name: "results", args: { id: 2 } });
    expect(parseArgs(["results"])).toEqual({ error: "results takes one poll id." });
  });

  test("an unknown or missing command prints the usage", () => {
    expect(parseArgs([])).toEqual({ error: USAGE });
    expect(parseArgs(["toString"])).toEqual({ error: USAGE });
  });
});

describe("poll", () => {
  test("question, options, defaults", () => {
    expect(parseArgs(["poll", "Bigger grids?", ...option(2)])).toEqual({
      name: "poll",
      args: {
        poll: { question: "Bigger grids?", options: ["O0", "O1"], hours: 24, multi: false },
        guildId: null,
      },
    });
  });

  test("--hours, --multi, --guild", () => {
    const parsed = parseArgs([
      "poll",
      "Q",
      ...option(3),
      ...words("--hours 48 --multi --guild g1"),
    ]);

    expect(parsed).toEqual({
      name: "poll",
      args: {
        poll: { question: "Q", options: ["O0", "O1", "O2"], hours: 48, multi: true },
        guildId: "g1",
      },
    });
  });

  test("2 to 10 options", () => {
    expect(parseArgs(["poll", "Q", ...option(1)])).toEqual({ error: "Give 2 to 10 --option." });
    expect(parseArgs(["poll", "Q", ...option(11)])).toEqual({ error: "Give 2 to 10 --option." });
    expect(parseArgs(["poll", "Q", ...option(10)])).toHaveProperty("name", "poll");
  });

  test("Discord's length limits", () => {
    expect(parseArgs(["poll", long(300), ...option(2)])).toHaveProperty("name", "poll");
    expect(parseArgs(["poll", long(301), ...option(2)])).toEqual({
      error: "The question is over 300 characters.",
    });
    expect(parseArgs(["poll", "Q", "--option", long(55), "--option", "b"])).toHaveProperty("name");
    expect(parseArgs(["poll", "Q", "--option", long(56), "--option", "b"])).toEqual({
      error: "An option is over 55 characters.",
    });
    expect(parseArgs(["poll", " ", ...option(2)])).toEqual({ error: "The question is empty." });
  });

  test("hours from 1 to 768, whole", () => {
    const wrong = { error: "--hours is a whole number from 1 to 768." };

    expect(hours("1")).toHaveProperty("name", "poll");
    expect(hours("768")).toHaveProperty("name", "poll");
    expect(hours("0")).toEqual(wrong);
    expect(hours("769")).toEqual(wrong);
    expect(hours("1.5")).toEqual(wrong);
    expect(hours("x")).toEqual(wrong);
  });

  test("one question", () => {
    expect(parseArgs(["poll", ...option(2)])).toEqual({
      error: "poll takes one question; quote it.",
    });
    expect(parseArgs(["poll", "Q", "R", ...option(2)])).toHaveProperty("error");
  });
});
