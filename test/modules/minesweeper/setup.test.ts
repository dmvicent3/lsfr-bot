import { describe, expect, test } from "bun:test";
import { resolveSetup } from "../../../src/modules/minesweeper/setup.ts";
import type { SetupOptions } from "../../../src/modules/minesweeper/types.ts";

const NONE: SetupOptions = { difficulty: null, width: null, height: null, mines: null };

describe("resolveSetup", () => {
  test("defaults to beginner", () => {
    expect(resolveSetup(NONE)).toEqual({ width: 9, height: 9, mines: 10 });
  });

  test("expert is 20×20 with 80 mines", () => {
    expect(resolveSetup({ ...NONE, difficulty: "expert" })).toEqual({
      width: 20,
      height: 20,
      mines: 80,
    });
  });

  test("a given mine count overrides the preset's", () => {
    expect(resolveSetup({ ...NONE, difficulty: "intermediate", mines: 50 })).toEqual({
      width: 16,
      height: 16,
      mines: 50,
    });
  });

  test("a custom size without mines keeps beginner density", () => {
    expect(resolveSetup({ ...NONE, width: 18, height: 18 })).toEqual({
      width: 18,
      height: 18,
      mines: 40,
    });
  });

  test("a custom size takes the chosen preset's density", () => {
    expect(resolveSetup({ ...NONE, difficulty: "expert", width: 5, height: 5 })).toEqual({
      width: 5,
      height: 5,
      mines: 5,
    });
  });

  test("cells minus nine is the most mines allowed", () => {
    expect(resolveSetup({ ...NONE, width: 5, height: 5, mines: 16 })).toEqual({
      width: 5,
      height: 5,
      mines: 16,
    });
    expect(resolveSetup({ ...NONE, width: 5, height: 5, mines: 17 })).toEqual({
      refusal: "Too many mines: a 5×5 board takes at most 16.",
    });
  });

  test("density-derived mines are at least one", () => {
    expect(resolveSetup({ ...NONE, width: 5, height: 5 })).toEqual({
      width: 5,
      height: 5,
      mines: 3,
    });
  });
});
