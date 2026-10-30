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

test("another item's answer that is also this picture's alias is never a wrong option", () => {
  const forts = [
    picture(100_011, "Agra Fort", { category: "Landmarks", aliases: ["Red Fort"] }),
    picture(100_012, "Red Fort", { category: "Landmarks" }),
    picture(100_013, "Taj Mahal", { category: "Landmarks" }),
    picture(100_014, "Petra", { category: "Landmarks" }),
    picture(100_015, "Alhambra", { category: "Landmarks" }),
  ];
  const q = pictureQuestion(forts[0] ?? picture(1, "x"), forts, Math.random);

  expect(q.wrong.toSorted()).toEqual(["Alhambra", "Petra", "Taj Mahal"]);
});
