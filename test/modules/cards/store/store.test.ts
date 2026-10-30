import { Database } from "bun:sqlite";
import { expect, test } from "bun:test";
import { runMigrations } from "../../../../src/core/db.ts";
import { cardsMigrations } from "../../../../src/modules/cards/store/migrations.ts";
import { CardsRepo } from "../../../../src/modules/cards/store/repo.ts";

function repo(): CardsRepo {
  const db = new Database(":memory:", { strict: true });
  runMigrations(db, cardsMigrations);

  return new CardsRepo(db);
}

const add = (r: CardsRepo, text: string, kind: "prompt" | "answer" = "answer", by = "u1") =>
  r.custom.add({ guildId: "g", kind, text, addedBy: by, at: 1 });

test("custom cards: added once per server, normalised duplicates refused", () => {
  const r = repo();

  expect(add(r, "A haunted Roomba")).toBe(1);
  expect(add(r, "a  HAUNTED roomba!")).toBe("duplicate");
  expect(
    r.custom.add({ guildId: "h", kind: "answer", text: "A haunted Roomba", addedBy: "u1", at: 1 }),
  ).toBe(2);
});

test("custom cards: the author or a manager removes; removed cards leave the deck", () => {
  const r = repo();
  const id = add(r, "Why ___?", "prompt");
  add(r, "Cheese");

  expect(r.custom.remove({ guildId: "g", id: Number(id), userId: "u2", manager: false })).toBe(
    "not-yours",
  );
  expect(r.custom.remove({ guildId: "g", id: 99, userId: "u1", manager: false })).toBe("not-found");
  expect(r.custom.remove({ guildId: "g", id: Number(id), userId: "u2", manager: true })).toBe(
    "removed",
  );
  expect(r.custom.live("g")).toEqual({ prompts: [], answers: [{ id: "c:2", text: "Cheese" }] });
  expect(add(r, "Why ___?", "prompt")).toBe(3);
});

test("custom cards: listed newest first, all or mine", () => {
  const r = repo();
  add(r, "One");
  add(r, "Two", "answer", "u2");

  expect(r.custom.list("g", null).map((c) => c.text)).toEqual(["Two", "One"]);
  expect(r.custom.list("g", "u2")).toEqual([{ id: 2, kind: "answer", text: "Two", addedBy: "u2" }]);
});

test("games: one live per channel; players and wins feed stats and standings", () => {
  const r = repo();
  const game = r.games.start({ guildId: "g", channelId: "c", startedBy: "u1", target: 3, at: 10 });

  expect(
    r.games.start({ guildId: "g", channelId: "c", startedBy: "u2", target: 3, at: 11 }),
  ).toBeNull();

  const id = Number(game);
  r.games.addPlayer(id, "u1");
  r.games.addPlayer(id, "u1");
  r.games.addPlayer(id, "u2");
  r.wins.add([
    { gameId: id, guildId: "g", userId: "u1", at: 20, prompt: "Why **cats**?", votes: 2 },
    { gameId: id, guildId: "g", userId: "u1", at: 30, prompt: "Who **dogs**?", votes: 3 },
    { gameId: id, guildId: "g", userId: "u2", at: 30, prompt: "Who **frogs**?", votes: 3 },
  ]);
  r.games.end(id, 40, "u1");

  expect(r.wins.standings("g", 0, 25)).toEqual([{ userId: "u1", wins: 1 }]);
  expect(r.wins.standings("g", 0, 100)).toEqual([
    { userId: "u1", wins: 2 },
    { userId: "u2", wins: 1 },
  ]);
  expect(r.wins.stats("g", "u1")).toEqual({
    games: 1,
    gamesWon: 1,
    roundsWon: 2,
    best: { prompt: "Who **dogs**?", votes: 3 },
  });
  expect(r.wins.stats("g", "u9")).toEqual({ games: 0, gamesWon: 0, roundsWon: 0, best: null });
  expect(r.games.start({ guildId: "g", channelId: "c", startedBy: "u2", target: 3, at: 50 })).toBe(
    2,
  );
  expect(r.games.endAllLive(60)).toBe(1);
});
