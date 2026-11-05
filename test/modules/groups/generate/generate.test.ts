import { expect, test } from "bun:test";
import { lcg } from "../../../../src/core/random.ts";
import { generate } from "../../../../src/modules/groups/generate/generate.ts";
import { membersOf } from "../../../../src/modules/groups/generate/pick.ts";
import { clashes } from "../../../../src/modules/groups/generate/clash.ts";
import { BANK, cat } from "./fixtures.ts";

test("four groups, one per level, sorted, with a shuffled order of all sixteen", () => {
  const p = generate({ bank: BANK, random: lcg(7), avoid: new Set() })!;

  expect(p.groups.map((g) => g.level)).toEqual([0, 1, 2, 3]);
  expect(p.groups.every((g) => g.words.length === 4)).toBe(true);
  expect(p.order.split("").toSorted().join("")).toBe("0123456789abcdef");
});

const seeded = () => ({ bank: BANK, random: lcg(3), avoid: new Set<string>() });

test("the same seed builds the same puzzle", () => {
  expect(generate(seeded())).toEqual(generate(seeded()));
});

test("avoided categories are not used", () => {
  for (let seed = 1; seed < 20; seed++) {
    const p = generate({ bank: BANK, random: lcg(seed), avoid: new Set(["Fish"]) })!;

    expect(p.groups[0]!.name).toBe("Birds");
  }
});

test("no level left means null", () => {
  expect(generate({ bank: BANK, random: lcg(1), avoid: new Set(["Card games"]) })).toBeNull();
});

test("no board word is a member of another chosen category, and none clash", () => {
  const bank = [
    cat("Fish", 0, ["bass", "salmon", "trout", "pike", "cod", "sole", "carp", "eel"]),
    cat("Weapons", 1, ["pike", "sword", "spear", "bow", "axe", "mace"], ["bass"]),
    cat("Shoes", 2, ["sole", "boot", "clog", "pump", "mule", "sandal"]),
    cat("Instruments", 3, ["bass", "drum", "harp", "flute", "lute", "oboe"]),
  ];

  for (let seed = 1; seed < 50; seed++) {
    const p = generate({ bank, random: lcg(seed), avoid: new Set() })!;
    const chosen = p.groups.map((g) => membersOf(bank.find((c) => c.name === g.name)!));
    const words = p.groups.flatMap((g) => g.words);

    p.groups.forEach((g, i) => {
      for (const w of g.words) {
        expect(chosen.filter((m, j) => j !== i && m.has(w))).toHaveLength(0);
      }
    });
    expect(new Set(words).size).toBe(16);
    words.forEach((a, i) => words.slice(i + 1).forEach((b) => expect(clashes(a, b)).toBe(false)));
  }
});

test("null when no combination fits", () => {
  const bank = [
    cat("A", 0, ["aa", "bb", "cc", "dd"]),
    cat("B", 1, ["aa", "ee", "ff", "gg"]),
    cat("C", 2, ["hh", "ii", "jj", "kk"]),
    cat("D", 3, ["ll", "mm", "nn", "oo"]),
  ];

  expect(generate({ bank, random: lcg(1), avoid: new Set() })).toBeNull();
});
