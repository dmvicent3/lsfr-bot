import { describe, expect, test } from "bun:test";
import { CLUE_MAX, writeClues } from "../../../../src/modules/crossword/clues/write.ts";

const entries = [
  { word: "CAT", def: "a small feline" },
  { word: "DOG", def: "(animal) a loyal pet" },
];
const reply = (text: string) => () => Promise.resolve(text);

describe("writeClues", () => {
  test("uses good JSON clues", async () => {
    const out = await writeClues(entries, reply('{"CAT":"Purring pet","DOG":"Barker"}'));
    expect(out).toEqual(["Purring pet", "Barker"]);
  });
  test("parses the first {...} amid text", async () => {
    const out = await writeClues(
      entries,
      reply('Sure! {"CAT":"Purring pet","DOG":"Barker"} done {"CAT":"x"}'),
    );
    expect(out).toEqual(["Purring pet", "Barker"]);
  });
  test("matches keys case-insensitively and ignores extras", async () => {
    const out = await writeClues(
      entries,
      reply('{"cat":"Purring pet","dog":"Barker","COW":"Moo"}'),
    );
    expect(out).toEqual(["Purring pet", "Barker"]);
  });
  test("missing word falls back to definition", async () => {
    const out = await writeClues(entries, reply('{"CAT":"Purring pet"}'));
    expect(out).toEqual(["Purring pet", "a loyal pet"]);
  });
  test("too long, empty or leaking clues fall back", async () => {
    const long = "x".repeat(CLUE_MAX + 1);
    const out = await writeClues(entries, reply(JSON.stringify({ CAT: long, DOG: "a dog" })));
    expect(out).toEqual(["a small feline", "a loyal pet"]);
    const out2 = await writeClues(entries, reply('{"CAT":"  ","DOG":"Barker"}'));
    expect(out2[0]).toBe("a small feline");
  });
  test("a brace inside a clue doesn't lose the reply", async () => {
    const out = await writeClues(entries, reply('{"CAT":"Purrs {softly}","DOG":"Barker"}'));
    expect(out).toEqual(["Purrs {softly}", "Barker"]);
  });
  test("a clue of exactly 90 characters is kept; an inflected answer leaks", async () => {
    const exact = "z".repeat(CLUE_MAX);
    const out = await writeClues(entries, reply(JSON.stringify({ CAT: exact, DOG: "Dogs' pal" })));
    expect(out).toEqual([exact, "a loyal pet"]);
  });
  test("long definition is cut to 89 plus ellipsis", async () => {
    const out = await writeClues([{ word: "CAT", def: "y".repeat(200) }], null);
    expect(out[0]).toBe(`${"y".repeat(CLUE_MAX - 1)}…`);
  });
  test("ask throws gives all definitions", async () => {
    const out = await writeClues(entries, () => Promise.reject(new Error("down")));
    expect(out).toEqual(["a small feline", "a loyal pet"]);
  });
  test("unparseable reply gives definitions", async () => {
    expect(await writeClues(entries, reply("no json"))).toEqual(["a small feline", "a loyal pet"]);
  });
  test("ask that never resolves times out", async () => {
    const out = await writeClues(entries, () => new Promise<string>(() => {}), 20);
    expect(out).toEqual(["a small feline", "a loyal pet"]);
  });
  test("null ask never calls", async () => {
    expect(await writeClues(entries, null)).toEqual(["a small feline", "a loyal pet"]);
  });
});
