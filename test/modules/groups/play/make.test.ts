import { expect, test } from "bun:test";
import { lcg } from "../../../../src/core/random.ts";
import { dailyMake, practiceMake } from "../../../../src/modules/groups/play/make.ts";
import { openDaily } from "../../../../src/modules/groups/play/open.ts";
import { newPractice, openPractice } from "../../../../src/modules/groups/play/practice.ts";
import { BANK, cat } from "../generate/fixtures.ts";
import { freshDb } from "../store/fixtures.ts";

test("a daily puzzle comes from the guild and date seed", () => {
  const { repo } = freshDb();
  const v = { guildId: "g", date: "2026-11-05" };

  expect(dailyMake(repo, v, BANK)()).toEqual(dailyMake(repo, v, BANK)());
});

test("a daily avoids the categories of the last 30 days", () => {
  const { repo } = freshDb();
  const bank = [
    ...BANK,
    cat("Metals", 1, ["iron", "tin", "gold", "lead", "zinc"]),
    cat("Fabrics", 2, ["silk", "wool", "linen", "satin", "denim"]),
    cat("Gems", 3, ["ruby", "opal", "jade", "pearl", "topaz"]),
  ];
  const yesterday = dailyMake(repo, { guildId: "g", date: "2026-11-04" }, bank)()!;
  repo.puzzles.create("g", "2026-11-04", yesterday);
  const today = dailyMake(repo, { guildId: "g", date: "2026-11-05" }, bank)()!;
  const names = (p: typeof today) => p.groups.map((g) => g.name);

  expect(names(today).filter((n) => names(yesterday).includes(n))).toEqual([]);
});

test("practice builds from the given random", () => {
  expect(practiceMake(lcg(5), BANK)()).toEqual(practiceMake(lcg(5), BANK)());
});

test("openDaily builds once and starts the player's game on the puzzle's order", () => {
  const { repo } = freshDb();
  const v = { guildId: "g", userId: "u", date: "2026-11-05", now: 3 };
  const opened = openDaily(repo, v, dailyMake(repo, v, BANK))!;
  const again = openDaily(repo, { ...v, now: 9 }, () => null)!;

  expect(opened.game).toMatchObject({ order: opened.puzzle.order, picked: "", startedAt: 3 });
  expect(again).toEqual(opened);
  expect(openDaily(repo, { ...v, date: "2026-11-06" }, () => null)).toBeNull();
});

test("practice is kept until a new one replaces it", () => {
  const { repo } = freshDb();
  const v = { guildId: "g", userId: "u", now: 3 };
  const first = openPractice(repo, v, practiceMake(lcg(1), BANK))!;

  expect(openPractice(repo, { ...v, now: 4 }, () => null)).toEqual(first);
  expect(newPractice(repo, { ...v, now: 5 }, practiceMake(lcg(2), BANK))?.startedAt).toBe(5);
  expect(newPractice(repo, v, () => null)).toBeNull();
  expect(repo.practice.get("g", "u")?.startedAt).toBe(5);
});
