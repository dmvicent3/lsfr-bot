import { expect, test } from "bun:test";
import { clear, toggle } from "../../../../src/modules/groups/play/select.ts";
import { progress } from "./fixtures.ts";

test("a click selects a word, keeping the picks sorted", () => {
  expect(toggle(progress({ picked: "5" }), 2)?.picked).toBe("25");
});

test("a second click unselects it", () => {
  expect(toggle(progress({ picked: "25" }), 5)?.picked).toBe("2");
});

test("a fifth pick changes nothing", () => {
  expect(toggle(progress({ picked: "0123" }), 9)).toBeNull();
});

test("a word of a found group changes nothing", () => {
  expect(toggle(progress({ found: "1" }), 5)).toBeNull();
  expect(toggle(progress(), 16)).toBeNull();
});

test("clear drops the picks; null when there were none", () => {
  expect(clear(progress({ picked: "12" }))?.picked).toBe("");
  expect(clear(progress())).toBeNull();
});
