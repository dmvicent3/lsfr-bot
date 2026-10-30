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

test("people and painters also answer to the last word of their name", () => {
  let next = 100_001;
  const people = toPictures({
    category: "People",
    prompt: "Who is this?",
    rows: [row("Q1", "Michael Schumacher", 9), row("Q2", "Martin Luther King Jr.", 8)],
    previous: new Map(),
    nextId: () => next++,
    surnames: true,
  });

  expect(people.map((p) => p.aliases)).toEqual([["Schumacher"], ["King"]]);
  expect(build([row("Q3", "Costa Rica", 1)])[0]?.aliases).toEqual([]);
});

test("an item with two different labels (two creators) is left out", () => {
  const out = build([
    row("Q1", "Hubert van Eyck", 9),
    row("Q1", "Jan van Eyck", 9),
    row("Q2", "Chad", 1),
  ]);

  expect(out.map((p) => p.answer)).toEqual(["Chad"]);
});

test("at most three pictures share an answer, the most famous kept", () => {
  const rows = [5, 4, 3, 2, 1].map((links) => row(`Q${links}`, "Vincent van Gogh", links));

  expect(build(rows).map((p) => p.qid)).toEqual(["Q5", "Q4", "Q3"]);
});

test("formal state names are answered by the short name", () => {
  const out = build([
    row("Q1", "Kingdom of the Netherlands", 3),
    row("Q2", "People's Republic of China", 2),
    row("Q3", "Democratic Republic of the Congo", 1),
  ]);

  expect(out.map((p) => p.answer)).toEqual([
    "Netherlands",
    "China",
    "Democratic Republic of the Congo",
  ]);
  expect(out[0]?.aliases).toEqual(["Kingdom of the Netherlands"]);
});

test("dictators are left out", () => {
  const out = build([row("Q1", "Benito Mussolini", 2), row("Q2", "Mao Zedong", 1)]);

  expect(out).toEqual([]);
});
