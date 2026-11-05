import { expect, test } from "bun:test";
import { lcg } from "../../../../src/core/random.ts";
import { membersOf, pickWords } from "../../../../src/modules/groups/generate/pick.ts";
import { cat } from "./fixtures.ts";

test("members are the playable words and the clash-only ones", () => {
  expect([...membersOf(cat("Fish", 0, ["bass"], ["jack"]))]).toEqual(["bass", "jack"]);
});

test("picks four words that are not members of the other categories", () => {
  const fish = cat("Fish", 0, ["bass", "salmon", "trout", "pike", "cod", "sole"]);
  const others = [new Set(["bass", "pike"])];

  for (let seed = 1; seed < 20; seed++) {
    const words = pickWords(fish, others, [], lcg(seed))!;

    expect(words).toHaveLength(4);
    expect(words).not.toContain("bass");
    expect(words).not.toContain("pike");
  }
});

test("skips words that clash with the board", () => {
  const fish = cat("Fish", 0, ["bass", "salmon", "trout", "pike", "cod"]);

  expect(pickWords(fish, [], ["spike"], lcg(1))?.toSorted()).toEqual([
    "bass",
    "cod",
    "salmon",
    "trout",
  ]);
});

test("null when fewer than four are left", () => {
  const fish = cat("Fish", 0, ["bass", "salmon", "trout", "pike"]);

  expect(pickWords(fish, [new Set(["bass"])], [], lcg(1))).toBeNull();
});
