import { describe, expect, test } from "bun:test";
import { setSetting } from "../../../src/core/settings.ts";
import { CrosswordRepo } from "../../../src/modules/crossword/store/repo.ts";
import { todayEntries } from "../../../src/modules/dailies/sources/today.ts";
import { DuelRepo } from "../../../src/modules/duel/store/repo.ts";
import { GridRepo } from "../../../src/modules/grid/store/repo.ts";
import { GroupsRepo } from "../../../src/modules/groups/store/repo.ts";
import { SnakeRepo } from "../../../src/modules/snake/store/repo.ts";
import { SudokuRepo } from "../../../src/modules/sudoku/store/repo.ts";
import { WordRepo } from "../../../src/modules/word/store/repo.ts";
import { game as crossword } from "../crossword/store/fixtures.ts";
import { game as duel } from "../duel/store/fixtures.ts";
import { game as grid } from "../grid/store/fixtures.ts";
import { game as groups } from "../groups/store/fixtures.ts";
import { game as snake } from "../snake/store/fixtures.ts";
import { game as sudoku } from "../sudoku/store/fixtures.ts";
import { multiGame, game as word } from "../word/fixtures.ts";
import { freshDailiesDb } from "./fixtures.ts";

/** 2026-11-03 12:00 UTC: the 3rd in Lisbon, the 4th in Kiritimati (UTC+14). */
const NOW = Date.UTC(2026, 10, 3, 12);
const who = { guildId: "g", userId: "u" };

describe("todayEntries", () => {
  test("nine dailies in order, all todo on a fresh day", () => {
    const list = todayEntries(freshDailiesDb(), who, NOW);
    expect(list.map((e) => e.label)).toEqual([
      "Word #7",
      // Duo and Quad launch after this date; FIRST_MULTI_PUZZLE moves to the launch day.
      "Word Duo #-1",
      "Word Quad #-1",
      "Sudoku #1",
      "Stat duel #1",
      "Country grid #1",
      "Crossword #1",
      // Groups launches after this date; FIRST_PUZZLE moves to the launch day.
      "Groups #-1",
      // Snake launches after this date; FIRST_PUZZLE moves to the launch day.
      "Snake #-1",
    ]);
    expect(list.map((e) => e.command)).toEqual([
      "word play",
      "word duo",
      "word quad",
      "sudoku daily",
      "duel play",
      "grid play",
      "crossword play",
      "groups play",
      "snake play",
    ]);
    expect(list.every((e) => e.state === "todo" && e.tz === "Europe/Lisbon")).toBe(true);
  });

  test("reads each game's row for today", () => {
    const db = freshDailiesDb();
    const words = new WordRepo(db).games;
    words.saveGuesses(word("u", "2026-11-03", { won: null, points: null, finishedAt: null }));
    words.finish(word("u", "2026-11-03"));
    const multi = new WordRepo(db).multiGames;
    multi.saveGuesses(multiGame({ date: "2026-11-03", guesses: ["crane"] }));
    multi.finish(
      multiGame({
        mode: "quad",
        date: "2026-11-03",
        won: false,
        found: 3,
        points: 150,
        finishedAt: 2,
      }),
    );
    new SudokuRepo(db).games.start(sudoku({ slot: "medium", level: "medium" }));
    new DuelRepo(db).games.start(duel({ correct: 5, points: 150, finishedAt: 2 }));
    new GridRepo(db).games.start(grid());
    new CrosswordRepo(db).games.start(crossword({ solved: false, points: 0, finishedAt: 2 }));
    new GroupsRepo(db).games.start(groups({ date: "2026-11-03" }));
    const snakes = new SnakeRepo(db).games;
    snakes.start(snake({ date: "2026-11-03" }));
    snakes.finish(
      snake({ date: "2026-11-03", solved: true, points: 70, streak: 1, finishedAt: 2 }),
    );
    const list = todayEntries(db, who, NOW);
    expect(list[3]?.label).toBe("Sudoku medium #1");
    const states = list.map((e) => `${e.state}:${e.result ?? ""}`);
    expect(states).toEqual([
      "done:130 pts",
      "started:",
      "done:3/4 · 150 pts",
      "started:",
      "done:5/5 · 150 pts",
      "started:",
      "done:gave up",
      "started:",
      "done:70 pts",
    ]);
  });

  test("ignores other players and other days", () => {
    const db = freshDailiesDb();
    new DuelRepo(db).games.start(duel({ userId: "v" }));
    new GridRepo(db).games.start(grid({ date: "2026-11-02" }));
    expect(todayEntries(db, who, NOW).every((e) => e.state === "todo")).toBe(true);
  });

  test("each game's own time zone picks its day", () => {
    const db = freshDailiesDb();
    setSetting(db, "duel.timezone.g", "Pacific/Kiritimati");
    new DuelRepo(db).games.start(duel({ date: "2026-11-04" }));
    const d = todayEntries(db, who, NOW).find((e) => e.label.startsWith("Stat duel"));
    expect(d).toMatchObject({ label: "Stat duel #2", state: "started", tz: "Pacific/Kiritimati" });
  });
});
