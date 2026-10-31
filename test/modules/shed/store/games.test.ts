import { Database } from "bun:sqlite";
import { expect, test } from "bun:test";
import { runMigrations } from "../../../../src/core/db.ts";
import { shedMigrations } from "../../../../src/modules/shed/store/migrations.ts";
import { ShedRepo } from "../../../../src/modules/shed/store/repo.ts";

function repo(): ShedRepo {
  const db = new Database(":memory:", { strict: true });
  runMigrations(db, shedMigrations);

  return new ShedRepo(db);
}

const start = (r: ShedRepo, channelId: string) =>
  r.games.start({ guildId: "g", channelId, startedBy: "u1", stacking: true, at: 1 });

test("one live game per channel; ending one frees the channel", () => {
  const r = repo();
  const id = start(r, "c1");
  expect(id).toBe(1);
  expect(start(r, "c1")).toBeNull();
  expect(start(r, "c2")).toBe(2);
  r.games.end(1, 5, 3);
  expect(start(r, "c1")).toBe(3);
});

test("endAllLive returns the live rows and closes them", () => {
  const r = repo();
  start(r, "c1");
  start(r, "c2");
  r.games.setMessage(1, "m1");
  r.games.end(2, 5, null);
  start(r, "c3");
  expect(r.games.endAllLive(9)).toEqual([
    { channelId: "c1", messageId: "m1" },
    { channelId: "c3", messageId: null },
  ]);
  expect(r.games.endAllLive(10)).toEqual([]);
  expect(start(r, "c1")).not.toBeNull();
});
