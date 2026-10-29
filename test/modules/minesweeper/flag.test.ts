import { describe, expect, test } from "bun:test";
import { toggleFlag } from "../../../src/modules/minesweeper/flag.ts";

describe("toggleFlag", () => {
  test("flags a hidden cell", () => {
    expect(toggleFlag(["hidden", "open"], 0)).toEqual({ cells: ["flag", "open"], hint: null });
  });

  test("unflags a flag", () => {
    expect(toggleFlag(["flag", "open"], 0)).toEqual({ cells: ["hidden", "open"], hint: null });
  });

  test("an open cell gives a hint", () => {
    expect(toggleFlag(["flag", "open"], 1)).toEqual({
      cells: ["flag", "open"],
      hint: "That cell is already open.",
    });
  });
});
