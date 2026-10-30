import { expect, test } from "bun:test";
import { classify } from "../../../../src/modules/trivia/data/classify.ts";

const multiple = (question: string, answer: string) => ({
  type: "multiple" as const,
  question,
  answer,
});

test("a plain question with a short answer is typed", () => {
  expect(classify(multiple("What is the capital of France?", "Paris"))).toBe("typed");
});

test("true/false is choice", () => {
  expect(classify({ type: "boolean", question: "The sky is blue.", answer: "True" })).toBe(
    "choice",
  );
});

test("questions that lean on the options are choice", () => {
  expect(classify(multiple("Which of these is a fruit?", "Apple"))).toBe("choice");
  expect(classify(multiple("Which of the following is a planet?", "Mars"))).toBe("choice");
  expect(classify(multiple("Which one of them sang Thriller?", "Michael Jackson"))).toBe(
    "choice",
  );
  expect(classify(multiple("What of the following is red?", "Blood"))).toBe("choice");
  expect(classify(multiple("What is NOT a planet?", "Pluto"))).toBe("choice");
});

test("'not' only counts as a whole word", () => {
  expect(classify(multiple("Who wrote Nothing Else Matters?", "Metallica"))).toBe("typed");
});

test("long, letterless, slashed or bracketed answers are choice", () => {
  expect(classify(multiple("Q?", "a".repeat(31)))).toBe("choice");
  expect(classify(multiple("Q?", "a".repeat(30)))).toBe("typed");
  expect(classify(multiple("In what year?", "1984"))).toBe("choice");
  expect(classify(multiple("Which band?", "AC/DC"))).toBe("choice");
  expect(classify(multiple("Where?", "Paris (France)"))).toBe("choice");
});
