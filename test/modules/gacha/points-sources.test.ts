import { Database } from "bun:sqlite";
import { expect, test } from "bun:test";
import { runMigrations } from "../../../src/core/db.ts";
import { earnedBy } from "../../../src/core/points.ts";
import { cardsPoints } from "../../../src/modules/cards/points.ts";
import { cardsMigrations } from "../../../src/modules/cards/store/migrations.ts";
import { crosswordPoints } from "../../../src/modules/crossword/points.ts";
import { crosswordMigrations } from "../../../src/modules/crossword/store/migrations.ts";
import { duelPoints } from "../../../src/modules/duel/points.ts";
import { duelMigrations } from "../../../src/modules/duel/store/migrations.ts";
import { fleetPoints } from "../../../src/modules/fleet/points.ts";
import { fleetMigrations } from "../../../src/modules/fleet/store/migrations.ts";
import { fourPoints } from "../../../src/modules/four/points.ts";
import { fourMigrations } from "../../../src/modules/four/store/migrations.ts";
import { gridPoints } from "../../../src/modules/grid/points.ts";
import { gridMigrations } from "../../../src/modules/grid/store/migrations.ts";
import { groupsPoints } from "../../../src/modules/groups/points.ts";
import { groupsMigrations } from "../../../src/modules/groups/store/migrations.ts";
import { shedPoints } from "../../../src/modules/shed/points.ts";
import { shedMigrations } from "../../../src/modules/shed/store/migrations.ts";
import { snakePoints } from "../../../src/modules/snake/points.ts";
import { snakeMigrations } from "../../../src/modules/snake/store/migrations.ts";
import { sudokuPoints } from "../../../src/modules/sudoku/points.ts";
import { sudokuMigrations } from "../../../src/modules/sudoku/store/migrations.ts";
import { triviaPoints } from "../../../src/modules/trivia/points.ts";
import { triviaMigrations } from "../../../src/modules/trivia/store/migrations.ts";
import { wordPoints } from "../../../src/modules/word/points.ts";
import { wordMigrations } from "../../../src/modules/word/store/migrations.ts";

const SOURCES = [
  ...wordPoints,
  ...sudokuPoints,
  ...crosswordPoints,
  ...groupsPoints,
  ...snakePoints,
  ...gridPoints,
  ...duelPoints,
  ...triviaPoints,
  ...shedPoints,
  ...fleetPoints,
  ...fourPoints,
  ...cardsPoints,
];

function setup(): Database {
  const db = new Database(":memory:", { strict: true });
  runMigrations(db, [
    ...wordMigrations,
    ...sudokuMigrations,
    ...crosswordMigrations,
    ...groupsMigrations,
    ...snakeMigrations,
    ...gridMigrations,
    ...duelMigrations,
    ...triviaMigrations,
    ...shedMigrations,
    ...fleetMigrations,
    ...fourMigrations,
    ...cardsMigrations,
  ]);

  return db;
}

const U = { guildId: "g", userId: "u" };

test("every game's source runs against its own schema", () => {
  const got = earnedBy(SOURCES, setup(), U);

  expect(got.map((g) => g.game)).toEqual([
    "word",
    "duo",
    "quad",
    "sudoku",
    "crossword",
    "groups",
    "snake",
    "grid",
    "duel",
    "trivia",
    "shed",
    "fleet",
    "four",
    "cards",
  ]);
  expect(got.every((g) => g.points === 0)).toBe(true);
});

test("counts what each leaderboard counts", () => {
  const db = setup();
  db.run(
    "INSERT INTO word_games (guild_id, date, user_id, guesses, points, finished_at) VALUES ('g', '2026-11-01', 'u', '[]', 120, 1), ('g', '2026-11-02', 'u', '[]', NULL, NULL)",
  );
  db.run(
    "INSERT INTO word_multi_games (guild_id, mode, date, user_id, guesses, points, finished_at) VALUES ('g', 'duo', '2026-11-01', 'u', '[]', 160, 1), ('g', 'quad', '2026-11-01', 'u', '[]', 260, 1)",
  );
  db.run(
    "INSERT INTO fleet_results (guild_id, player_id, difficulty, result, how, shots, hits, ended_at) VALUES ('g', 'u', 'hard', 'win', 'sunk', 40, 17, 1), ('g', 'u', 'easy', 'win', 'sunk', 50, 17, 2), ('g', 'u', 'hard', 'loss', 'sunk', 60, 10, 3)",
  );
  db.run(
    "INSERT INTO cards_wins (game_id, guild_id, user_id, at, prompt, votes) VALUES (1, 'g', 'u', 1, 'p', 2), (1, 'g', 'u', 2, 'p', 1)",
  );
  const got = new Map(earnedBy(SOURCES, db, U).map((g) => [g.game, g.points]));

  expect(got.get("word")).toBe(120);
  expect(got.get("duo")).toBe(160);
  expect(got.get("quad")).toBe(260);
  expect(got.get("fleet")).toBe(4);
  expect(got.get("cards")).toBe(2);
});
