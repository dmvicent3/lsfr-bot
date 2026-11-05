import { describe, expect, test } from "bun:test";
import { draftOf, strays } from "../../../scripts/groups-bank/category.ts";
import { levelled, obscurity } from "../../../scripts/groups-bank/level.ts";
import { member } from "./fixtures.ts";

const five = ["ash", "oak", "elm", "fir", "yew"].map((w) => member(w));

describe("draftOf", () => {
  test("keeps common words and puts the rest in also", () => {
    const d = draftOf({ id: "t.n.1", name: "Trees" }, [
      ...five,
      member("rowan", 30_000),
      member("pine", 5, 4),
    ]);

    expect(d?.words.map((m) => m.word)).toEqual(["ash", "oak", "elm", "fir", "yew"]);
    expect(d?.also).toEqual(["rowan", "pine"]);
  });
  test("drops and adds by hand", () => {
    const d = draftOf({ id: "t.n.1", name: "Trees", drop: ["ash"], add: ["rowan"] }, [
      ...five,
      member("rowan", 30_000),
    ]);

    expect(d?.words.map((m) => m.word)).toEqual(["oak", "elm", "fir", "yew", "rowan"]);
    expect(d?.also).toEqual(["ash"]);
  });
  test("skips two-letter words", () => {
    expect(draftOf({ id: "t.n.1", name: "T" }, [...five.slice(1), member("ox")])).toBeNull();
  });
  test("keeps a fixed level", () =>
    expect(draftOf({ id: "t.n.1", name: "T", level: 2 }, five)?.level).toBe(2));
});

describe("strays", () => {
  test("names drops and adds that are not members", () => {
    expect(strays({ id: "t.n.1", name: "T", drop: ["ash", "oops"], add: ["nope"] }, five)).toEqual([
      "oops",
      "nope",
    ]);
  });
});

describe("obscurity", () => {
  test("rises with rank and sense", () => {
    expect(obscurity([member("a", 10)])).toBeLessThan(obscurity([member("a", 1000)]));
    expect(obscurity([member("a", 10)])).toBeLessThan(obscurity([member("a", 10, 3)]));
  });
});

const draft = (name: string, rank: number, level?: number) => ({
  name,
  words: [member(name, rank)],
  also: [],
  ...(level === undefined ? {} : { level }),
});

describe("levelled", () => {
  test("levels by obscurity quartile", () => {
    const bank = levelled([draft("d", 9000), draft("a", 1), draft("c", 900), draft("b", 90)]);

    expect(bank.map((c) => [c.name, c.level])).toEqual([
      ["d", 3],
      ["a", 0],
      ["c", 2],
      ["b", 1],
    ]);
  });
  test("a fixed level wins", () => expect(levelled([draft("a", 1, 3)])[0]?.level).toBe(3));
});
