import { describe, expect, test } from "bun:test";
import { ButtonStyle, ComponentType } from "discord.js";
import { clue } from "../../../../src/modules/snake/clue/clue.ts";
import { barsOf } from "../../../../src/modules/snake/render/bars.ts";
import { HOW_TO, body, header } from "../../../../src/modules/snake/render/board.ts";
import { FILL, TILE, boardSvg } from "../../../../src/modules/snake/render/board-svg.ts";
import { boardView } from "../../../../src/modules/snake/render/board-view.ts";
import { controlRow } from "../../../../src/modules/snake/render/buttons.ts";
import { SHOWN, boardLines } from "../../../../src/modules/snake/render/lines.ts";
import { guessModal } from "../../../../src/modules/snake/render/modal.ts";
import { resultLine, resultLines } from "../../../../src/modules/snake/render/result.ts";
import { roundedPath } from "../../../../src/modules/snake/render/shape.ts";
import type { BoardView } from "../../../../src/modules/snake/render/types.ts";
import { BOARD_FILE, snakeView } from "../../../../src/modules/snake/render/view.ts";
import { viewText } from "../../crossword/view-text.ts";
import { ANSWER, game, practice } from "../store/fixtures.ts";

const DAILY = { scope: "2026-11-08", number: 3, answer: ANSWER, untilNext: "5h 2m" };
const PRACTICE = { scope: "practice", number: null, answer: ANSWER };

const view = (over: Partial<BoardView> = {}): BoardView => ({
  ...boardView(DAILY, game({ guesses: ["permit", "imply"] })),
  ...over,
});

const width = (g: string) =>
  Number(/width="(\d+)"/.exec(boardSvg(boardLines([g], ANSWER).lines))?.[1]);

const labels = (v: BoardView) => controlRow(v).flatMap((r) => r.components.map((b) => b.label));

describe("barsOf", () => {
  test("EXCUSE against EXAMPLE: a capped E=X bar, loose letters, a capped last E", () =>
    expect(barsOf(clue("excuse", "example"))).toEqual([
      { from: 0, to: 1, colour: "green", capStart: true, capEnd: false },
      { from: 2, to: 2, colour: "dark", capStart: false, capEnd: false },
      { from: 3, to: 3, colour: "dark", capStart: false, capEnd: false },
      { from: 4, to: 4, colour: "dark", capStart: false, capEnd: false },
      { from: 5, to: 5, colour: "green", capStart: false, capEnd: true },
    ]));

  test("the answer is one bar with both caps", () =>
    expect(barsOf(clue("example", "example"))).toEqual([
      { from: 0, to: 6, colour: "green", capStart: true, capEnd: true },
    ]));
});

test("roundedPath: the corner radii of each end", () => {
  const path = roundedPath({ x: 0, y: 0, w: 100, h: 50, left: 25, right: 8 });
  expect(path).toStartWith("M25,0 H92 A8,8");
  expect(path).toContain("A25,25 0 0 1 0,25");
});

describe("boardLines and boardSvg", () => {
  test("only the latest guesses, numbered from the first", () => {
    const guesses = Array.from({ length: SHOWN + 3 }, (_, k) => `w${k}`);
    const { lines, earlier } = boardLines(guesses, ANSWER);
    expect(earlier).toBe(3);
    expect(lines).toHaveLength(SHOWN);
    expect(lines[0]?.n).toBe(4);
    expect(lines.at(-1)?.letters).toBe(`w${SHOWN + 2}`);
  });

  test("one shape per bar, one letter per tile, a number per row", () => {
    const { lines } = boardLines(["excuse", "example"], ANSWER);
    const svg = boardSvg(lines);
    expect(svg.match(/<path /g)).toHaveLength(6);
    expect(svg.match(/font-size="28"/g)).toHaveLength(13);
    expect(svg).toContain(`>2</text>`);
    expect(svg).toContain(FILL.green);
    expect(svg).toContain(`A${TILE / 2},${TILE / 2}`);
  });

  test("the width follows the longest guess, at least five tiles", () => {
    expect(width("ox")).toBe(width("plane"));
    expect(width("everything")).toBeGreaterThan(width("plane"));
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
    expect(body(view({ guesses: [] }), 0)).toBe(HOW_TO);
    expect(body(view(), 0)).toBe("");
    expect(body(view(), 4)).toBe("_4 earlier guesses not shown_");
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
    expect(body(practiced, 0)).not.toContain(HOW_TO);
  });

  test("the public line never names the word", () => {
    const won = game({ guesses: ["imply", "example"], solved: true, points: 90, finishedAt: 5 });
    expect(resultLine(3, won)).toBe("<@u> solved Snake #3 in 2 guesses — 90 pts");
    const lost = game({ guesses: ["imply"], solved: false, points: 0, finishedAt: 5 });
    expect(resultLine(3, lost)).toBe("<@u> gave up on Snake #3 after 1 guess");
  });
});

describe("buttons, modal and message", () => {
  test("Guess and Give up while playing; practice adds New, kept once finished", () => {
    expect(labels(view())).toEqual(["Guess", "Give up"]);
    expect(controlRow(view())[0]?.components[0]).toMatchObject({
      custom_id: "snake:guess:2026-11-08:1",
      style: ButtonStyle.Primary,
    });
    expect(labels(view({ finished: true }))).toEqual([]);
    expect(labels(view({ number: null, finished: true }))).toEqual(["New"]);
  });

  test("the modal has one text input for a 2–10 letter word", () => {
    const m = guessModal({ scope: "practice", stamp: "1", title: "Practice snake" }).toJSON();
    expect(m.custom_id).toBe("snake:answer:practice:1");
    expect(m.title).toBe("Practice snake");
    expect(JSON.stringify(m.components)).toContain('"label":"Your guess"');
    expect(JSON.stringify(m.components)).toContain('"min_length":2,"max_length":10');
  });

  test("no picture before the first guess, one after", () => {
    const empty = snakeView(view({ guesses: [] }));
    expect(empty.files).toEqual([]);
    expect(viewText(empty)).toContain("Find the hidden word");
    const played = snakeView(view());
    expect(played.files[0]?.name).toBe(BOARD_FILE);
    expect(played.attachments).toEqual([]);
    expect(played.components.some((c) => c.type === ComponentType.MediaGallery)).toBe(true);
  });
});
