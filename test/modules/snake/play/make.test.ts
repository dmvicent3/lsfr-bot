import { describe, expect, test } from "bun:test";
import { AVOID_DAYS, dailyMake, practiceMake } from "../../../../src/modules/snake/play/make.ts";
import { loadAnswers } from "../../../../src/modules/snake/words/load.ts";
import { seeded } from "../../shed/testing/random.ts";
import { freshDb } from "../store/fixtures.ts";

describe("dailyMake", () => {
  test("the same answer for the same server and date", () => {
    const a = dailyMake(freshDb().repo, { guildId: "g", date: "2026-11-06" })();
    const b = dailyMake(freshDb().repo, { guildId: "g", date: "2026-11-06" })();
    expect(a).toBe(b);
    expect(loadAnswers()).toContain(a ?? "");
  });

  test("skips the answers of the last year, not older ones", () => {
    const { repo } = freshDb();
    repo.puzzles.create("g", "2026-01-01", "zebra");
    repo.puzzles.create("g", "2025-11-01", "lemon");
    const answers = ["zebra", "lemon"];
    const make = dailyMake(repo, { guildId: "g", date: "2026-11-06" }, answers);
    expect(make()).toBe("lemon");
    expect(AVOID_DAYS).toBe(365);
  });

  test("every answer used: any answer", () => {
    const { repo } = freshDb();
    repo.puzzles.create("g", "2026-11-05", "zebra");
    expect(dailyMake(repo, { guildId: "g", date: "2026-11-06" }, ["zebra"])()).toBe("zebra");
  });

  test("no answers: null", () =>
    expect(dailyMake(freshDb().repo, { guildId: "g", date: "2026-11-06" }, [])()).toBeNull());
});

test("practiceMake picks from the list with the given random", () =>
  expect(practiceMake(seeded(3), ["only"])()).toBe("only"));

describe("the answer list", () => {
  const answers = loadAnswers();

  test("thousands of 4–10 letter words, sorted, no repeats", () => {
    expect(answers.length).toBeGreaterThan(5000);
    expect(answers.every((w) => /^[a-z]{4,10}$/.test(w))).toBe(true);
    expect(new Set(answers).size).toBe(answers.length);
    expect(answers).toEqual(answers.toSorted());
  });

  test("every length from 4 to 10 has hundreds", () => {
    for (let n = 4; n <= 10; n++) {
      expect(answers.filter((w) => w.length === n).length).toBeGreaterThan(300);
    }
  });

  test("blocked words, names and plurals stay out", () => {
    for (const w of ["bullshit", "charlie", "women", "things", "walked"]) {
      expect(answers).not.toContain(w);
    }
  });
});
