import { expect, test } from "bun:test";
import { check } from "../../../../src/modules/sudoku/play/check.ts";
import { makeGame, setAt } from "./game.ts";

test("check marks only wrong non-given filled cells and adds 1", () => {
  const cells = setAt(setAt(makeGame().cells, 2, "9"), 3, "6");
  const step = check(makeGame({ cells, cursor: 3 }));

  expect(step.game.wrong[2]).toBe("1");
  expect(step.game.wrong.split("").filter((c) => c === "1")).toHaveLength(1);
  expect(step.game.checks).toBe(1);
  expect(step.game.cursor).toBe(3);
  expect(step.note).toBeNull();
});

test("check marks no empty cells or givens", () => {
  const step = check(makeGame());

  expect(step.game.wrong).toBe("0".repeat(81));
  expect(step.game.checks).toBe(1);
});

test("check recomputes marks, dropping stale ones", () => {
  const g = makeGame({ wrong: setAt("0".repeat(81), 2, "1") });

  expect(check(g).game.wrong[2]).toBe("0");
});

test("check on a solved game does nothing", () => {
  const g = makeGame({ solvedAt: 1 });
  const step = check(g);

  expect(step.game).toBe(g);
  expect(step.game.checks).toBe(0);
});
