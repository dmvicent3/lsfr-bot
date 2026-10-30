import { expect, test } from "bun:test";
import { openTopics, pickRound } from "../../../src/modules/trivia/pick.ts";
import { kaos, question, scripted } from "./fixtures.ts";

const questions = [
  question(1),
  question(2),
  question(3, { kind: "choice" }),
  question(4, { kind: "typed", category: "Sports" }),
];
const lists = [kaos(1)];
const base = { questions, lists, lastAsked: new Map<string, number>(), topic: null };

test("a low first draw is a KAOS round", () => {
  expect(pickRound({ ...base, random: scripted(0.05, 0) }).kind).toBe("kaos");
});

test("otherwise typed two times in three, button one in three", () => {
  expect(pickRound({ ...base, random: scripted(0.5, 0.5, 0) }).kind).toBe("typed");
  expect(pickRound({ ...base, random: scripted(0.5, 0.9, 0) }).kind).toBe("button");
});

test("button rounds only use choice questions, typed only typed", () => {
  const button = pickRound({ ...base, random: scripted(0.5, 0.9, 0) });
  const typed = pickRound({ ...base, random: scripted(0.5, 0.5, 0.99) });

  expect(button.kind === "button" && button.question.id).toBe(3);
  expect(typed.kind === "typed" && typed.question.kind).toBe("typed");
});

test("never-asked questions come before asked ones, then the oldest", () => {
  const lastAsked = new Map([
    ["question:1", 100],
    ["question:2", 50],
    ["question:4", 200],
  ]);
  const picked = pickRound({ ...base, lastAsked, random: scripted(0.5, 0.5, 0) });

  expect(picked.kind === "typed" && picked.question.id).toBe(2);
});

test("a topic round is never KAOS and stays in the topic", () => {
  const picked = pickRound({ ...base, topic: "Sports", random: scripted(0.05, 0.5, 0) });

  expect(picked.kind).toBe("typed");
  expect(picked.kind !== "kaos" && picked.question.category).toBe("Sports");
});

test("a kind the topic lacks falls back to the other kind", () => {
  const picked = pickRound({ ...base, topic: "Sports", random: scripted(0.5, 0.9, 0) });

  expect(picked.kind).toBe("typed");
});

test("open topics are the categories with a never-asked question, sorted", () => {
  const lastAsked = new Map([["question:4", 1]]);

  expect(openTopics(questions, lastAsked)).toEqual(["General Knowledge"]);
  expect(openTopics(questions, new Map())).toEqual(["General Knowledge", "Sports"]);
});

test("with every question asked, all topics are open", () => {
  const lastAsked = new Map(questions.map((q) => [`question:${q.id}`, 1]));

  expect(openTopics(questions, lastAsked)).toEqual(["General Knowledge", "Sports"]);
});

test("at most 25 topics", () => {
  const many = Array.from({ length: 30 }, (_, i) => question(i, { category: `C${100 + i}` }));

  expect(openTopics(many, new Map())).toHaveLength(25);
});
