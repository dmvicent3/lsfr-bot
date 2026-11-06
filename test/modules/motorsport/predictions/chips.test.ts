import { describe, expect, test } from "bun:test";
import {
  chipApplies,
  chipLabel,
  chipPoints,
  chipValue,
  parseChip,
} from "../../../../src/modules/motorsport/predictions/chips.ts";
import type { Chip } from "../../../../src/modules/motorsport/predictions/types.ts";

const chip = (
  kind: Chip["kind"],
  sessionId: string | null = null,
  position: number | null = null,
) => ({ kind, sessionId, position });

describe("chip values", () => {
  test("round-trip through the select value", () => {
    for (const c of [chip("double"), chip("safety"), chip("lateswap"), chip("triple", "race", 2)]) {
      expect(parseChip(chipValue(c))).toEqual(c);
    }
  });

  test("none and anything malformed are no chip", () => {
    for (const v of ["none", "", "quad", "triple", "triple:race:3", "triple:race:x"]) {
      expect(parseChip(v)).toBeNull();
    }
  });

  test("labels", () => {
    expect(chipLabel(chip("double"))).toBe("⏫ Double Weekend");
    expect(chipLabel(chip("triple", "race", 0), "Race")).toBe("🎯 Triple Pick: Race P1");
    expect(chipLabel(chip("triple", "race", 1))).toBe("🎯 Triple Pick P2");
  });
});

describe("chipPoints", () => {
  /** P1 exact (5), P2 on the podium in the wrong place (2), P3 off it. */
  const mixed = { each: [5, 2, 0], bonus: 0 };
  const perfect = { each: [5, 5, 5], bonus: 5 };

  test("no chip: the plain score", () => {
    expect(chipPoints(mixed, [])).toBe(7);
    expect(chipPoints(perfect, [])).toBe(20);
  });

  test("Double Weekend doubles", () => {
    expect(chipPoints(mixed, [chip("double")])).toBe(14);
    expect(chipPoints(perfect, [chip("double")])).toBe(40);
  });

  test("Triple Pick triples the marked pick, never the bonus", () => {
    expect(chipPoints(mixed, [chip("triple", "race", 0)])).toBe(17);
    expect(chipPoints(mixed, [chip("triple", "race", 1)])).toBe(11);
    expect(chipPoints(mixed, [chip("triple", "race", 2)])).toBe(7);
    expect(chipPoints(perfect, [chip("triple", "race", 0)])).toBe(30);
  });

  test("Safety Net floors an entered session at 5", () => {
    expect(chipPoints({ each: [0, 0, 2], bonus: 0 }, [chip("safety")])).toBe(5);
    expect(chipPoints(mixed, [chip("safety")])).toBe(7);
  });

  test("Late Swap changes nothing about the points", () => {
    expect(chipPoints(mixed, [chip("lateswap")])).toBe(7);
  });

  test("order: Triple, then the Safety Net floor, then Double", () => {
    const low = { each: [0, 2, 0], bonus: 0 };
    // Triple 2 → 6, floor keeps 6, double → 12.
    expect(chipPoints(low, [chip("double"), chip("safety"), chip("triple", "r", 1)])).toBe(12);
    // Nothing to triple: floor 0 → 5, double → 10.
    expect(chipPoints({ each: [0, 0, 0], bonus: 0 }, [chip("double"), chip("safety")])).toBe(10);
  });
});

test("which sessions a chip changes", () => {
  expect(chipApplies(chip("double"), "qualifying", "qualifying")).toBe(true);
  expect(chipApplies(chip("safety"), "sprint-race", "sprint")).toBe(true);
  expect(chipApplies(chip("triple", "race", 0), "race", "race")).toBe(true);
  expect(chipApplies(chip("triple", "race", 0), "qualifying", "qualifying")).toBe(false);
  expect(chipApplies(chip("lateswap"), "race", "race")).toBe(true);
  expect(chipApplies(chip("lateswap"), "qualifying", "qualifying")).toBe(false);
});
