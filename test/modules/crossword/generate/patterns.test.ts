import { describe, expect, test } from "bun:test";
import { PATTERNS } from "../../../../src/modules/crossword/generate/patterns.ts";
import { slotsOf } from "../../../../src/modules/crossword/generate/slots.ts";

const cases = ([5, 7, 15] as const).flatMap((size) =>
  PATTERNS[size].map((b) => ({ size, blocks: b })),
);

function connected(size: number, blocks: number[]): boolean {
  const white = Array.from({ length: size * size }, (_, i) => i).filter((i) => !blocks.includes(i));
  const seen = new Set([white[0]]);
  const stack = [white[0]];

  while (stack.length) {
    const i = stack.pop()!;
    const near = [i - size, i + size, i % size ? i - 1 : -1, (i + 1) % size ? i + 1 : -1];

    for (const j of near)
      if (white.includes(j) && !seen.has(j)) {
        seen.add(j);
        stack.push(j);
      }
  }

  return seen.size === white.length;
}

describe("patterns", () => {
  test("about six per size", () => {
    expect(PATTERNS[5].length).toBeGreaterThanOrEqual(5);
    expect(PATTERNS[7].length).toBeGreaterThanOrEqual(5);
    expect(PATTERNS[15].length).toBeGreaterThanOrEqual(8);
  });

  for (const { size, blocks } of cases) {
    describe(`${size}x${size} [${blocks.join(",")}]`, () => {
      const slots = slotsOf(size, blocks);

      test("180 degree symmetric", () => {
        const set = new Set(blocks);

        expect(blocks.every((b) => set.has(size * size - 1 - b))).toBe(true);
      });

      test("every slot at least 3 long", () => {
        expect(slots.every((s) => s.cells.length >= 3)).toBe(true);
      });

      test("every white cell is in one across and one down slot", () => {
        for (let i = 0; i < size * size; i++) {
          if (blocks.includes(i)) continue;

          expect(slots.filter((s) => s.dir === "a" && s.cells.includes(i)).length).toBe(1);
          expect(slots.filter((s) => s.dir === "d" && s.cells.includes(i)).length).toBe(1);
        }
      });

      test("whites connected", () => {
        expect(connected(size, blocks)).toBe(true);
      });

      test("at most 7 long, the bank's longest words", () => {
        expect(slots.every((s) => s.cells.length <= 7)).toBe(true);
      });

      if (size < 15) {
        test("at most 25 slots, one select", () => {
          expect(slots.length).toBeLessThanOrEqual(25);
        });
      }
    });
  }
});
