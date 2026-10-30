import { expect, test } from "bun:test";
import { kaosLists } from "../../../../src/modules/trivia/data/load.ts";
import { normalize } from "../../../../src/modules/trivia/match.ts";

const lists = kaosLists();

test("ids are unique", () => {
  expect(new Set(lists.map((l) => l.id)).size).toBe(lists.length);
});

test("every list has 4 to 15 items", () => {
  for (const l of lists) {
    expect(l.items.length, l.prompt).toBeGreaterThanOrEqual(4);
    expect(l.items.length, l.prompt).toBeLessThanOrEqual(15);
  }
});

test("no two answers or aliases of one list read the same", () => {
  for (const l of lists) {
    const names = l.items.flatMap((i) => [i.answer, ...(i.aliases ?? [])]).map(normalize);

    expect(new Set(names).size, l.prompt).toBe(names.length);
  }
});

test("no Pokémon", () => {
  for (const l of lists) {
    const text = normalize([l.prompt, ...l.items.flatMap((i) => [i.answer, ...(i.aliases ?? [])])].join(" "));

    expect(text).not.toContain("pokemon");
  }
});
