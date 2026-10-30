import { expect, test } from "bun:test";
import { type PictureRow, toPictures } from "../../../../src/modules/trivia/data/pictures.ts";

const row = (
  qid: string,
  label: string,
  links: number,
  over: Partial<PictureRow> = {},
): PictureRow => ({
  qid,
  label,
  image: `${label}.jpg`,
  links,
  aliases: [],
  ...over,
});

const build = (rows: PictureRow[], previous = new Map<string, number>()) => {
  let next = 100_001;

  return toPictures({
    category: "Flags",
    prompt: "Name the country",
    rows,
    previous,
    nextId: () => next++,
  });
};

test("one entry per item, the first image kept", () => {
  const out = build([row("Q1", "Portugal", 9), row("Q1", "Portugal", 9, { image: "other.svg" })]);

  expect(out).toHaveLength(1);
  expect(out[0]).toMatchObject({
    category: "Flags",
    prompt: "Name the country",
    image: "Portugal.jpg",
  });
});

test("labels that are bare QIDs are dropped", () => {
  expect(build([row("Q2", "Q2", 9)])).toEqual([]);
});

test("aliases keep 3+ Latin characters that differ from the answer", () => {
  const [p] = build([
    row("Q3", "United Kingdom", 9, {
      aliases: ["UK", "Britain", "Великобритания", "united kingdom", "Great Britain"],
    }),
  ]);

  expect(p?.aliases).toEqual(["Britain", "Great Britain"]);
});

test("difficulty in thirds by sitelinks", () => {
  const rows = [6, 5, 4, 3, 2, 1].map((n) => row(`Q${n}`, `C${n}`, n));

  expect(build(rows).map((p) => p.difficulty)).toEqual([
    "easy",
    "easy",
    "medium",
    "medium",
    "hard",
    "hard",
  ]);
});

test("ids are kept by category and QID, new ones counted on", () => {
  const out = build(
    [row("Q5", "Spain", 9), row("Q6", "France", 8)],
    new Map([["Flags:Q6", 100_050]]),
  );

  expect(out.map((p) => p.id)).toEqual([100_001, 100_050]);
});

test("Pokémon are dropped", () => {
  expect(build([row("Q7", "Pokémon Red", 9)])).toEqual([]);
});

test("a bracketed label is shortened, the full one kept as an alias", () => {
  const [p] = build([row("Q8", "Madame X (Virginie Gautreau)", 9)]);

  expect(p?.answer).toBe("Madame X");
  expect(p?.aliases).toContain("Madame X (Virginie Gautreau)");
});

test("blocked people are dropped", () => {
  expect(build([row("Q9", "George Floyd", 9), row("Q10", "Adolf Hitler", 9)])).toEqual([]);
});
