import { expect, test } from "bun:test";
import { buttonsOnlyBank } from "../../../src/modules/trivia/buttons-only.ts";
import { pickRound } from "../../../src/modules/trivia/pick.ts";
import { kaos, picture, question, scripted } from "./fixtures.ts";

const flags = ["Portugal", "Spain", "France", "Italy"].map((a, i) => picture(100_001 + i, a));
const bank = buttonsOnlyBank({
  questions: [question(1), question(2, { kind: "choice" }), question(3, { kind: "choice" })],
  lists: [kaos(1)],
  pictures: flags,
});
const base = { ...bank, lastAsked: new Map<string, number>(), topic: null, buttonsOnly: true };

test("the buttons-only bank drops typed questions and KAOS lists, keeps pictures", () => {
  expect(bank.questions.map((q) => q.id)).toEqual([2, 3]);
  expect(bank.lists).toEqual([]);
  expect(bank.pictures).toHaveLength(4);
});

test("buttons only: text rounds are buttons, even on the typed share of the draw", () => {
  const picked = pickRound({ ...base, random: scripted(0.5, 0.1, 0) });

  expect(picked.kind).toBe("button");
});

test("buttons only: a typeable picture is still asked with buttons", () => {
  const picked = pickRound({ ...base, random: scripted(0.2, 0, 0.2) });

  expect(picked.kind === "button" && picked.question.image).toBe("Flag of Portugal.svg");
});

test("buttons only: a picture with no wrong options gives way to a text button round", () => {
  const lone = [picture(100_001, "Portugal")];
  const picked = pickRound({ ...base, pictures: lone, random: scripted(0.2) });

  expect(picked.kind).toBe("button");
  expect(picked.kind === "button" && picked.question.image).toBeUndefined();
});

test("buttons only: no KAOS even when lists are passed", () => {
  const picked = pickRound({ ...base, lists: [kaos(1)], random: scripted(0.05, 0, 0) });

  expect(picked.kind).toBe("button");
});
