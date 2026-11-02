import { expect, test } from "bun:test";
import { isOver, submit } from "../../../../src/modules/grid/play/answer.ts";
import { empty, ref, state } from "./fixtures.ts";

test("a country valid for the cell fills it and adds points", () => {
  const out = submit(state(), 0, "Spain", ref);

  expect(out.kind).toBe("hit");

  if (out.kind !== "hit") return;

  expect(out.iso2).toBe("ES");
  expect(out.cells[0]).toBe("ES");
  expect(out.guesses).toBe(1);
  expect(out.points).toBeGreaterThanOrEqual(10);
  expect(out.points).toBeLessThanOrEqual(30);
});

test("a country valid elsewhere but wrong here is a miss that names the reason", () => {
  const out = submit(state(), 3, "Japan", ref);

  expect(out.kind).toBe("miss");

  if (out.kind !== "miss") return;

  expect(out.name).toBe("Japan");
  expect(out.reasons).toEqual(["isn't an EU member"]);
  expect(out.cells[3]).toBe("");
  expect(out.guesses).toBe(1);
});

test("an unrecognised name costs nothing", () => {
  expect(submit(state(), 0, "Narnia", ref)).toEqual({ kind: "unknown", text: "Narnia" });
});

test("a country already on the grid costs nothing", () => {
  const cells = empty();
  cells[1] = "ES";
  const out = submit(state({ cells, guesses: 1 }), 0, "Spain", ref);

  expect(out).toEqual({ kind: "used", name: "Spain" });
});

test("finished, filled cell or no guesses left is stale", () => {
  const cells = empty();
  cells[0] = "ES";

  expect(submit(state({ finished: true }), 0, "Spain", ref)).toEqual({ kind: "stale" });
  expect(submit(state({ cells }), 0, "France", ref)).toEqual({ kind: "stale" });
  expect(submit(state({ guesses: 9 }), 0, "Spain", ref)).toEqual({ kind: "stale" });
});

test("isOver: all filled or nine guesses", () => {
  expect(isOver(empty(), 8)).toBe(false);
  expect(isOver(empty(), 9)).toBe(true);
  expect(
    isOver(
      Array.from({ length: 9 }, () => "ES"),
      3,
    ),
  ).toBe(true);
});

test("the ninth guess is accepted and ends the game", () => {
  const out = submit(state({ guesses: 8 }), 3, "Japan", ref);

  expect(out.kind).toBe("miss");

  if (out.kind !== "miss") return;

  expect(isOver(out.cells, out.guesses)).toBe(true);
});
