import { expect, test } from "bun:test";
import { lcg } from "../../../../src/core/random.ts";
import {
  clearPicks,
  giveUp,
  pickWord,
  shuffleWords,
  submit,
} from "../../../../src/modules/groups/play/turn.ts";
import type { Rec } from "../../../../src/modules/groups/play/types.ts";
import type { GroupsRepo } from "../../../../src/modules/groups/store/repo.ts";
import type { Game } from "../../../../src/modules/groups/types.ts";
import { freshDb, game, practice } from "../store/fixtures.ts";

function daily(over: Partial<Game> = {}) {
  const { repo } = freshDb();
  const rec = repo.games.start(game(over));

  return { repo, turn: (r: Rec = rec) => ({ repo, rec: r, now: 50 }) };
}

const storedGame = (repo: GroupsRepo) => repo.games.get("g", "2026-11-05", "u")!;

test("a pick is stored", () => {
  const { repo, turn } = daily();

  expect(pickWord(turn(), 3).game.picked).toBe("3");
  expect(storedGame(repo).picked).toBe("3");
});

test("clear and shuffle are stored", () => {
  const { repo, turn } = daily({ picked: "12" });

  expect(clearPicks(turn()).game.picked).toBe("");
  shuffleWords(turn(storedGame(repo)), lcg(2));
  expect(storedGame(repo).order).not.toBe("0123456789abcdef");
});

test("a right guess is stored; the last one solves and scores", () => {
  const { repo, turn } = daily({ found: "01", picked: "89ab" });
  submit(turn());

  expect(storedGame(repo).found).toBe("012");

  const last = submit(turn({ ...storedGame(repo), picked: "cdef" }));

  expect(last.award).toEqual({ points: 100, parts: ["Solved: 100"] });
  expect(storedGame(repo)).toMatchObject({ solved: true, points: 100, streak: 1, finishedAt: 50 });
});

test("the fourth mistake loses: 0 points, streak reset", () => {
  const { repo, turn } = daily({ picked: "0148", guesses: "0124,0125,0126", mistakes: 3 });
  const landed = submit(turn());

  expect(landed.award).toEqual({ points: 0, parts: [] });
  expect(storedGame(repo)).toMatchObject({ solved: false, points: 0, streak: 0, mistakes: 4 });
});

test("a solve the day after a solve extends the streak; after a loss it starts over", () => {
  const { repo } = freshDb();
  repo.games.start(game({ date: "2026-11-04" }));
  repo.games.finish(
    game({ date: "2026-11-04", solved: true, points: 100, streak: 4, finishedAt: 1 }),
  );
  const rec = repo.games.start(game({ found: "012", picked: "cdef" }));

  expect(submit({ repo, rec, now: 9 }).award?.points).toBe(120);
  expect(storedGame(repo).streak).toBe(5);

  const other = freshDb().repo;
  other.games.start(game({ date: "2026-11-04" }));
  other.games.finish(
    game({ date: "2026-11-04", solved: false, points: 0, streak: 0, finishedAt: 1 }),
  );
  const next = other.games.start(game({ found: "012", picked: "cdef" }));

  expect(submit({ repo: other, rec: next, now: 9 }).game).toMatchObject({ streak: 1 });
});

test("give up loses; a finished round ignores every move", () => {
  const { repo, turn } = daily();
  giveUp(turn());
  const done = storedGame(repo);

  expect(done).toMatchObject({ solved: false, points: 0 });
  expect(pickWord(turn(done), 1).game).toBe(done);
  expect(giveUp(turn(done)).award).toBeNull();
  expect(submit(turn({ ...done, picked: "0123" })).award).toBeNull();
});

test("a submit without four picks changes nothing", () => {
  const { turn } = daily({ picked: "01" });

  expect(submit(turn()).game.picked).toBe("01");
});

test("practice rounds finish without an award", () => {
  const { repo } = freshDb();
  const rec = practice({ found: "012", picked: "cdef" });
  repo.practice.replace(rec);
  const landed = submit({ repo, rec, now: 7 });

  expect(landed.award).toBeNull();
  expect(repo.practice.get("g", "u")?.finishedAt).toBe(7);
});

test("a stale move on a finished stored round returns the stored one", () => {
  const { repo, turn } = daily();
  const open = storedGame(repo);
  giveUp(turn());

  expect(pickWord(turn(open), 2).game.finishedAt).toBe(50);
});
