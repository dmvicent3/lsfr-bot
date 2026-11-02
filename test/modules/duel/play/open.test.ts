import { beforeEach, expect, test } from "bun:test";
import { openDay } from "../../../../src/modules/duel/play/open.ts";
import type { DuelRepo } from "../../../../src/modules/duel/store/repo.ts";
import type { Snapshot } from "../../../../src/modules/duel/types.ts";
import { fixtureSnapshot } from "../fixtures.ts";
import { freshDb } from "../store/fixtures.ts";

let repo: DuelRepo;

beforeEach(() => {
  repo = freshDb().repo;
});

const view = (userId: string, snapshot: Snapshot) => ({
  guildId: "g",
  userId,
  date: "2026-11-03",
  now: 5,
  snapshot,
});

test("two players get the same puzzle and generation runs once", () => {
  const first = openDay(repo, view("u", fixtureSnapshot()));
  let reads = 0;
  const spy = new Proxy(fixtureSnapshot(), {
    get(target, key) {
      if (key === "countries") reads++;

      return Reflect.get(target, key);
    },
  });
  const second = openDay(repo, view("v", spy));

  expect(reads).toBe(0);
  expect(second.puzzle).toEqual(first.puzzle);
  expect(first.puzzle.questions.length).toBeGreaterThan(0);
  expect(first.game.userId).toBe("u");
  expect(second.game.userId).toBe("v");
  expect(second.game.startedAt).toBe(5);
});

test("reopening returns the stored game", () => {
  const first = openDay(repo, view("u", fixtureSnapshot()));
  repo.games.save({ ...first.game, answers: "a" });
  const again = openDay(repo, { ...view("u", fixtureSnapshot()), now: 99 });

  expect(again.game.answers).toBe("a");
  expect(again.game.startedAt).toBe(5);
});
