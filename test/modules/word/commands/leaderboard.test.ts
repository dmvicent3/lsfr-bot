import type { Database } from "bun:sqlite";
import { beforeEach, expect, test } from "bun:test";
import { runMigrations } from "../../../../src/core/db.ts";
import { coreMigrations } from "../../../../src/core/settings.ts";
import { leaderboardView } from "../../../../src/modules/word/commands/leaderboard.ts";
import type { WordRepo } from "../../../../src/modules/word/store/repo.ts";
import { freshDb, game, seed } from "../fixtures.ts";

let db: Database;
let repo: WordRepo;

beforeEach(() => {
  ({ db, repo } = freshDb());
  runMigrations(db, coreMigrations);

  for (let n = 1; n <= 12; n++) seed(repo, game(`u${n}`, "2026-10-28", { points: 200 - n }));
});

const view = (page: number, now: number) =>
  leaderboardView(db, repo, { guildId: "g", period: "week", page, viewerId: "u1", now });

test("page 2 of the week while it is current", () => {
  const v = view(2, Date.UTC(2026, 9, 29, 12));
  expect(v.content).toContain("**11.** <@u11>");
  expect(v.components).toHaveLength(1);
});

test("after the week rolls over it shows the new week, no buttons", () => {
  const v = view(2, Date.UTC(2026, 10, 2, 12));
  expect(v.content).toContain("No games yet");
  expect(v.components).toEqual([]);
});
