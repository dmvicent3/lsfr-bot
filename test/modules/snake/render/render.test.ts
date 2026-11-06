import { describe, expect, test } from "bun:test";
import { ButtonStyle } from "discord.js";
import { clue } from "../../../../src/modules/snake/clue/clue.ts";
import { HOW_TO, LIMIT, body, header } from "../../../../src/modules/snake/render/board.ts";
import { boardView } from "../../../../src/modules/snake/render/board-view.ts";
import { controlRow } from "../../../../src/modules/snake/render/buttons.ts";
import { guessRow, latest } from "../../../../src/modules/snake/render/lines.ts";
import {
  SHARE_ROWS,
  resultLine,
  resultLines,
} from "../../../../src/modules/snake/render/result.ts";
import type { BoardView } from "../../../../src/modules/snake/render/types.ts";
import { squares } from "../../../../src/modules/snake/render/squares.ts";
import { snakeView } from "../../../../src/modules/snake/render/view.ts";
import { viewText } from "../../crossword/view-text.ts";
import { ANSWER, game, practice } from "../store/fixtures.ts";

const DAILY = { scope: "2026-11-08", number: 3, answer: ANSWER, untilNext: "5h 2m" };
const PRACTICE = { scope: "practice", number: null, answer: ANSWER };

const view = (over: Partial<BoardView> = {}): BoardView => ({
  ...boardView(DAILY, game({ guesses: ["permit", "imply"] })),
  ...over,
});

const labels = (v: BoardView) => controlRow(v).flatMap((r) => r.components.map((b) => b.label));

const COLLEGE = ["daily", "molest", "prolapse", "colgate", "collage", "college"];

describe("emoji rows", () => {
  test("the player's COLLEGE board", () =>
    expect(COLLEGE.map((g) => guessRow(g, "college"))).toEqual([
      "`D A I L Y` ⬛⬛⬛🟩⬛",
      "`M O L E S T` ⬛💚💚🟩⬛⬛",
      "`P R O L A P S E` ⬛⬛💚💚⬛⬛⬛🟢",
      "`C O L G A T E` 🟢💚💚🟩⬛⬛🟢",
      "`C O L L A G E` 🟢💚💚💚⬛💚🟢",
      "`C O L L E G E` 🟢💚💚💚💚💚🟢",
    ]));

  test("yellow for a letter in the word elsewhere", () =>
    expect(squares(clue("permit", "example"))).toBe("🟨🟩⬛🟩⬛⬛"));

  test("a cap wins over the joined marker", () =>
    expect(squares(clue("excuse", "example"))).toBe("🟢💚⬛⬛⬛🟢"));

  test("latest keeps the newest rows that fit and counts the rest", () => {
    expect(latest(["aa", "bb", "cc"], 6)).toEqual({ shown: ["bb", "cc"], earlier: 1 });
    expect(latest(["aa", "bb"], 100)).toEqual({ shown: ["aa", "bb"], earlier: 0 });
    expect(latest(["aa"], 1)).toEqual({ shown: [], earlier: 1 });
  });
});

describe("text", () => {
  test("header names the round and counts guesses", () => {
    expect(header(view())).toBe("**Snake #3** · 2 guesses");
    expect(header(boardView(PRACTICE, practice({ guesses: ["ox"] })))).toBe(
      "**Practice snake** · 1 guess",
    );
  });

  test("the how-to shows until the first guess", () => {
    expect(body(view({ guesses: [] }))).toBe(`${HOW_TO}
Guess with \`/snake guess word:\`.`);
    expect(body(view({ guesses: [], number: null }))).toEndWith(
      "Guess with `/snake guess word: practice:True`.",
    );
    expect(body(view())).toBe("");
  });

  test("a solved daily shows its points and the time to the next", () => {
    const solved = boardView(
      DAILY,
      game({ guesses: ["imply", "example"], solved: true, points: 90, streak: 1, finishedAt: 5 }),
    );
    expect(solved.solved).toBe(true);
    expect(resultLines(solved)).toEqual([
      "Solved in 2 guesses: 90",
      "**90 points**",
      "",
      "Next snake in 5h 2m",
    ]);
  });

  test("a give-up shows the word", () => {
    const lost = boardView(
      DAILY,
      game({ guesses: ["imply"], solved: false, points: 0, finishedAt: 5 }),
    );
    expect(resultLines(lost)[0]).toBe("Gave up — 0 points, the word was **EXAMPLE**");
    const practiced = boardView(PRACTICE, practice({ finishedAt: 5 }));
    expect(resultLines(practiced)).toEqual(["Gave up — the word was **EXAMPLE**"]);
    expect(body(practiced)).not.toContain(HOW_TO);
  });

  test("the public post: the emoji grid, never the letters or the word", () => {
    const won = game({ guesses: ["imply", "example"], solved: true, points: 90, finishedAt: 5 });
    expect(resultLine(3, won, ANSWER)).toBe(
      "<@u> solved Snake #3 in 2 guesses — 90 pts\n⬛💚💚💚⬛\n🟢💚💚💚💚💚🟢",
    );
    const lost = game({ guesses: ["imply"], solved: false, points: 0, finishedAt: 5 });
    expect(resultLine(3, lost, ANSWER)).toBe("<@u> gave up on Snake #3 after 1 guess\n⬛💚💚💚⬛");
  });

  test("a long public post shows the latest rows and counts the rest", () => {
    const guesses = [...Array.from({ length: SHARE_ROWS + 4 }, () => "imply"), "example"];
    const won = game({ guesses, solved: true, points: 10, finishedAt: 5 });
    const lines = resultLine(3, won, ANSWER).split("\n");
    expect(lines).toHaveLength(SHARE_ROWS + 2);
    expect(lines[1]).toBe("_5 earlier guesses not shown_");
    expect(lines.at(-1)).toBe("🟢💚💚💚💚💚🟢");
    expect(lines.join("\n")).not.toMatch(/imply|example/i);
  });
});

describe("buttons, modal and message", () => {
  test("Give up while playing; practice adds New, kept once finished", () => {
    expect(labels(view())).toEqual(["Give up"]);
    expect(controlRow(view())[0]?.components[0]).toMatchObject({
      custom_id: "snake:giveup:2026-11-08:1",
      style: ButtonStyle.Danger,
    });
    expect(labels(view({ finished: true }))).toEqual([]);
    expect(labels(view({ number: null, finished: true }))).toEqual(["New"]);
  });

  test("the board is text: no picture, and an edit clears an old one", () => {
    const empty = snakeView(view({ guesses: [] }));
    expect(viewText(empty)).toContain("Find the hidden word");
    const played = snakeView(view());
    expect(played).not.toHaveProperty("files");
    expect(played.attachments).toEqual([]);
    expect(JSON.stringify(played)).not.toContain("attachment://");
    expect(viewText(played)).toBe(
      "**Snake #3** · 2 guesses\n`P E R M I T` 🟨🟩⬛🟩⬛⬛\n`I M P L Y` ⬛💚💚💚⬛",
    );
  });

  test("many long guesses: the latest rows within the limit, the rest counted", () => {
    const guesses = Array.from({ length: 100 }, () => "everything");
    const text = viewText(snakeView(view({ guesses })));
    expect(text.length).toBeLessThanOrEqual(LIMIT);
    expect(text).toMatch(/\n_\d+ earlier guesses not shown_\n`E V E R Y T H I N G`/);
    const shown = text.split("\n").filter((l) => l.startsWith("`")).length;
    expect(text).toContain(`_${100 - shown} earlier guesses not shown_`);
    expect(shown).toBeGreaterThan(30);
  });

  test("a finished daily within the limit too", () => {
    const guesses = Array.from({ length: 100 }, () => "everything");
    const done = view({ guesses, finished: true, award: { points: 5, parts: ["x"] } });
    expect(viewText(snakeView(done)).length).toBeLessThanOrEqual(LIMIT);
  });
});
