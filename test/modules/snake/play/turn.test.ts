import { describe, expect, test } from "bun:test";
import { openDaily } from "../../../../src/modules/snake/play/open.ts";
import { newPractice, openPractice } from "../../../../src/modules/snake/play/practice.ts";
import { giveUp, guess } from "../../../../src/modules/snake/play/turn.ts";
import type { Rec } from "../../../../src/modules/snake/play/types.ts";
import { ANSWER, anyWord, freshDb, game, practice } from "../store/fixtures.ts";

const words = () => anyWord();
const DATE = "2026-11-06";

function daily(over: Parameters<typeof game>[0] = {}) {
  const { repo } = freshDb();
  repo.puzzles.create("g", DATE, ANSWER);
  const rec = repo.games.start(game(over));

  return { repo, turn: (r: Rec = rec) => ({ repo, rec: r, answer: ANSWER, now: 50 }) };
}

describe("openDaily", () => {
  test("picks the answer on first open and starts the game", () => {
    const { repo } = freshDb();
    const opened = openDaily(
      repo,
      { guildId: "g", userId: "u", date: DATE, now: 7 },
      () => "zebra",
    );
    expect(opened?.answer).toBe("zebra");
    expect(opened?.game).toMatchObject({ guesses: [], startedAt: 7, finishedAt: null });
    const again = openDaily(repo, { guildId: "g", userId: "v", date: DATE, now: 8 }, () => "lemon");
    expect(again?.answer).toBe("zebra");
  });

  test("no answer: null and nothing stored", () => {
    const { repo } = freshDb();
    expect(
      openDaily(repo, { guildId: "g", userId: "u", date: DATE, now: 7 }, () => null),
    ).toBeNull();
    expect(repo.games.get("g", DATE, "u")).toBeNull();
  });
});

describe("practice rounds", () => {
  test("the kept round, else a new one; New replaces it", () => {
    const { repo } = freshDb();
    const v = { guildId: "g", userId: "u", now: 3 };
    expect(openPractice(repo, v, () => "zebra")?.answer).toBe("zebra");
    expect(openPractice(repo, v, () => "lemon")?.answer).toBe("zebra");
    expect(newPractice(repo, v, () => "lemon")?.answer).toBe("lemon");
    expect(newPractice(repo, v, () => null)).toBeNull();
    expect(repo.practice.get("g", "u")?.answer).toBe("lemon");
  });
});

describe("guess", () => {
  test("a word is added to the guesses and kept", () => {
    const { repo, turn } = daily();
    const out = guess(turn(), " Permit ", words);
    expect(out).toMatchObject({ kind: "played", landed: { award: null } });
    expect(repo.games.get("g", DATE, "u")?.guesses).toEqual(["permit"]);
  });

  test("a refused word changes nothing", () => {
    const { repo, turn } = daily({ guesses: ["permit"] });
    expect(guess(turn(), "permit", words)).toEqual({ kind: "refused", reason: "repeat" });
    expect(guess(turn(), "x", words)).toEqual({ kind: "refused", reason: "length" });
    expect(repo.games.get("g", DATE, "u")?.guesses).toEqual(["permit"]);
  });

  test("the answer solves the daily: scored, streak 1", () => {
    const { repo, turn } = daily({ guesses: ["permit", "imply"] });
    const out = guess(turn(), "EXAMPLE", words);
    expect(out).toMatchObject({ kind: "played", landed: { award: { points: 80 } } });
    expect(repo.games.get("g", DATE, "u")).toMatchObject({
      guesses: ["permit", "imply", "example"],
      solved: true,
      points: 80,
      streak: 1,
      finishedAt: 50,
    });
  });

  test("a solve the day after a solve extends the streak", () => {
    const { repo, turn } = daily();
    repo.games.start(game({ date: "2026-11-05" }));
    repo.games.finish(
      game({ date: "2026-11-05", solved: true, points: 100, streak: 4, finishedAt: 2 }),
    );
    guess(turn(), "example", words);
    expect(repo.games.get("g", DATE, "u")).toMatchObject({ streak: 5, points: 120 });
  });

  test("a finished round refuses more guesses", () => {
    const { turn } = daily();
    const done = game({ finishedAt: 9, solved: false, guesses: [] });
    expect(guess(turn(done), "permit", words)).toEqual({ kind: "refused", reason: "finished" });
  });

  test("practice: the answer finishes it without an award", () => {
    const { repo } = freshDb();
    const rec = practice({ guesses: ["imply"] });
    repo.practice.replace(rec);
    const out = guess({ repo, rec, answer: ANSWER, now: 9 }, "example", words);
    expect(out).toMatchObject({ kind: "played", landed: { award: null } });
    expect(repo.practice.get("g", "u")).toMatchObject({
      guesses: ["imply", "example"],
      finishedAt: 9,
    });
  });
});

describe("giveUp", () => {
  test("0 points and the streak resets", () => {
    const { repo, turn } = daily({ guesses: ["permit"] });
    const out = giveUp(turn());
    expect(out.award).toEqual({ points: 0, parts: [] });
    expect(repo.games.get("g", DATE, "u")).toMatchObject({ solved: false, points: 0, streak: 0 });
  });

  test("a finished round stays as it is", () => {
    const { turn } = daily();
    const done = game({ finishedAt: 9, solved: true });
    expect(giveUp(turn(done))).toEqual({ game: done, award: null });
  });
});
