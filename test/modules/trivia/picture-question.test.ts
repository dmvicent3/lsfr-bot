import { expect, test } from "bun:test";
import { pictureQuestion } from "../../../src/modules/trivia/picture-question.ts";
import { picture } from "./fixtures.ts";

const pool = [
  picture(100_001, "Portugal", { aliases: ["Portuguese Republic"] }),
  picture(100_002, "Spain"),
  picture(100_003, "France"),
  picture(100_004, "Italy"),
  picture(100_005, "spain"),
  picture(100_006, "Mona Lisa", { category: "Paintings" }),
];

test("a picture becomes a question with its image, prompt and aliases", () => {
  const q = pictureQuestion(pool[0] ?? picture(1, "x"), pool, () => 0);

  expect(q).toMatchObject({
    id: 100_001,
    category: "Picture: Flags",
    question: "Name the country",
    answer: "Portugal",
    aliases: ["Portuguese Republic"],
    image: "Flag of Portugal.svg",
    kind: "choice",
  });
});

test("wrong options come from the same category, distinct and never the answer", () => {
  const q = pictureQuestion(pool[1] ?? picture(1, "x"), pool, Math.random);

  expect(q.wrong).toHaveLength(3);
  expect(q.wrong.toSorted()).toEqual(["France", "Italy", "Portugal"]);
});

test("too few other answers: typed only", () => {
  const q = pictureQuestion(pool[5] ?? picture(1, "x"), pool, Math.random);

  expect(q).toMatchObject({ kind: "typed", wrong: [] });
});
