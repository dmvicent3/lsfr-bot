import { expect, spyOn, test } from "bun:test";
import { act } from "../../../../src/modules/sudoku/components/act.ts";
import { clear } from "../../../../src/modules/sudoku/play/clear.ts";
import { put } from "../../../../src/modules/sudoku/play/put.ts";
import type { Game } from "../../../../src/modules/sudoku/types.ts";
import { almostSolved, makeGame } from "../play/game.ts";
import { freshDb } from "../store/fixtures.ts";
import { fakeClick } from "./fake.ts";

const DAILY = ["daily", "2026-11-03", "easy"];

const daily = (over: Partial<Game> = {}): Game =>
  makeGame({
    kind: "daily",
    date: "2026-11-03",
    slot: "easy",
    startedAt: Date.now() - 63_000,
    ...over,
  });

const almost = (): Partial<Game> => {
  const { givens, cells, cursor } = almostSolved();

  return { givens, cells, cursor };
};

test("a put updates the board and saves it", async () => {
  const { repo } = freshDb();
  const g = daily();
  repo.games.start(g);
  const { i, calls } = fakeClick("u");
  await act(i, repo, DAILY, (x) => put(x, 5));

  expect(repo.games.get(g)?.cells[2]).toBe("5");
  expect(calls.update).toHaveLength(1);
  expect(calls.reply).toHaveLength(0);
});

test("a no-op with a note answers ephemerally and saves nothing", async () => {
  const { repo } = freshDb();
  const g = daily({ cursor: 0 });
  repo.games.start(g);
  const { i, calls } = fakeClick("u");
  await act(i, repo, DAILY, (x) => put(x, 5));

  expect(calls.reply).toHaveLength(1);
  expect(calls.update).toHaveLength(0);
  expect(repo.games.get(g)).toEqual(g);
});

test("the solving put stores the award and posts a public line without pings", async () => {
  const { repo } = freshDb();
  const g = daily(almost());
  repo.games.start(g);
  const { i, calls } = fakeClick("u");
  await act(i, repo, DAILY, (x) => put(x, Number(x.solution[40])));

  const stored = repo.games.get(g);
  expect(stored?.solvedAt).not.toBeNull();
  expect(stored?.points).toBeGreaterThan(0);
  expect(calls.send).toHaveLength(1);
  const msg = calls.send[0];
  expect(msg?.content).toMatch(/^<@u> solved Sudoku #1 \(easy\) in 1m \d+s, 0 checks$/);
  expect(msg?.allowedMentions).toEqual({ parse: [] });
});

test("a failing public post is logged and the game still counts", async () => {
  const { repo } = freshDb();
  const g = daily(almost());
  repo.games.start(g);
  const err = spyOn(console, "error").mockImplementation(() => {});
  const { i, calls } = fakeClick("u", { failSend: true });
  await act(i, repo, DAILY, (x) => put(x, Number(x.solution[40])));

  expect(err).toHaveBeenCalled();
  err.mockRestore();
  expect(repo.games.get(g)?.points).toBeGreaterThan(0);
  expect(calls.update).toHaveLength(1);
});

test("a click on a solved game shows the finished board", async () => {
  const { repo } = freshDb();
  const g = daily({ solvedAt: Date.now(), points: 10, streak: 1 });
  repo.games.start(g);
  const { i, calls } = fakeClick("u");
  await act(i, repo, DAILY, (x) => clear(x));

  const msg = calls.update[0];
  expect(msg?.components).toEqual([]);
  expect(calls.send).toHaveLength(0);
});

test("another user's click never touches the owner's game", async () => {
  const { repo } = freshDb();
  const g = daily();
  repo.games.start(g);
  const { i, calls } = fakeClick("other");
  await act(i, repo, DAILY, (x) => put(x, 5));

  expect(calls.reply).toHaveLength(1);
  expect(calls.reply[0]?.content).toMatch(/out of date/);
  expect(repo.games.get(g)).toEqual(g);
});

test("junk key args get the out-of-date reply", async () => {
  const { repo } = freshDb();
  const { i, calls } = fakeClick("u");
  await act(i, repo, ["nope"], (x) => put(x, 5));

  expect(calls.reply).toHaveLength(1);
});
