import { expect, test } from "bun:test";
import { boardSvg, COLOURS } from "../../../../src/modules/sudoku/render/board-svg.ts";
import { toggleNote } from "../../../../src/modules/sudoku/play/notes.ts";
import type { Game } from "../../../../src/modules/sudoku/types.ts";
import { makeGame, setAt } from "../play/game.ts";

// EASY: cells 0 (5) and 1 (3) are givens, 2 and 3 empty.
const ALL = [1, 2, 3, 4, 5, 6, 7, 8, 9];

/** Every `<text>` as {x, y, size, bold, fill, text}. */
const texts = (svg: string) =>
  [
    ...svg.matchAll(
      /<text x="([\d.]+)" y="([\d.]+)" font-size="(\d+)"( font-weight="bold")? text-anchor="middle" fill="([^"]+)">([^<]*)<\/text>/g,
    ),
  ].map((m) => ({
    x: Number(m[1]),
    y: Number(m[2]),
    size: Number(m[3]),
    bold: !!m[4],
    fill: m[5],
    text: m[6] ?? "",
  }));
const sized = (g: Game, size: number) => texts(boardSvg(g)).filter((t) => t.size === size);

test("size: 48 px cells after a 24 px gutter, white background, DejaVu Sans", () => {
  const svg = boardSvg(makeGame());

  expect(svg).toStartWith('<svg xmlns="http://www.w3.org/2000/svg" width="460" height="460"');
  expect(svg).toContain('font-family="DejaVu Sans"');
  expect(svg).toContain('<rect width="460" height="460" fill="#fff"/>');
});

test("column letters A–I across the top, row numbers 1–9 down the left, 14 px grey", () => {
  const labels = sized(makeGame(), 14);

  expect(labels.map((t) => t.text).join("")).toBe("ABCDEFGHI123456789");
  expect(labels.every((t) => t.fill === "#555" && !t.bold)).toBe(true);
  expect(labels[0]).toMatchObject({ x: 48, y: 17 });
  expect(labels[8]).toMatchObject({ x: 24 + 8 * 48 + 24, y: 17 });
  expect(labels[9]).toMatchObject({ x: 12, y: 53 });
  expect(labels[17]).toMatchObject({ x: 12, y: 24 + 8 * 48 + 29 });
});

test("thin grey cell lines, thick dark box lines and border", () => {
  const svg = boardSvg(makeGame());

  expect(svg.match(/stroke="#999" stroke-width="1"/g)).toHaveLength(12);
  expect(svg.match(/stroke="#111" stroke-width="3"/g)).toHaveLength(8);
  expect(svg).toContain('<line x1="24" y1="24" x2="24" y2="456" stroke="#111" stroke-width="3"/>');
  expect(svg).toContain('<line x1="72" y1="24" x2="72" y2="456" stroke="#999" stroke-width="1"/>');
});

test("the cursor cell is filled yellow", () => {
  const svg = boardSvg(makeGame({ cursor: 10 }));

  expect(svg).toContain('<rect x="72" y="72" width="48" height="48" fill="#fff3b0"/>');
  expect(svg.match(/#fff3b0/g)).toHaveLength(1);
});

test("givens bold dark, entries blue, checked-wrong entries red, centred 30 px", () => {
  const cells = setAt(setAt(makeGame().cells, 2, "4"), 3, "9");
  const digits = sized(makeGame({ cells, wrong: setAt("0".repeat(81), 3, "1") }), 30);

  expect(digits.slice(0, 4)).toEqual([
    { x: 48, y: 59, size: 30, bold: true, fill: COLOURS.given, text: "5" },
    { x: 96, y: 59, size: 30, bold: true, fill: COLOURS.given, text: "3" },
    { x: 144, y: 59, size: 30, bold: false, fill: COLOURS.entry, text: "4" },
    { x: 192, y: 59, size: 30, bold: false, fill: COLOURS.wrong, text: "9" },
  ]);
  expect(COLOURS).toEqual({ given: "#111", entry: "#1a5fb4", wrong: "#c01c28" });
});

test("notes sit at their 3×3 spot in the cell, 12 px grey", () => {
  const notes = ALL.reduce((n, d) => toggleNote(n, 2, d), toggleNote("", 3, 5));
  const marks = sized(makeGame({ notes }), 12);

  expect(marks.map((t) => t.text).join("")).toBe("1234567895");
  expect(marks.every((t) => t.fill === "#666" && !t.bold)).toBe(true);
  expect(marks[0]).toMatchObject({ x: 120 + 8, y: 24 + 8 + 4 });
  expect(marks[4]).toMatchObject({ x: 120 + 24, y: 24 + 24 + 4 });
  expect(marks[8]).toMatchObject({ x: 120 + 40, y: 24 + 40 + 4 });
  expect(marks[9]).toMatchObject({ x: 24 + 3 * 48 + 24, y: 24 + 24 + 4 });
});

test("notes are hidden under a digit", () => {
  const notes = toggleNote(toggleNote("", 2, 7), 0, 1);
  const cells = setAt(makeGame().cells, 2, "4");

  expect(sized(makeGame({ cells, notes }), 12)).toEqual([]);
});

test("text content is only digits and A–I, so nothing needs escaping", () => {
  const notes = ALL.reduce((n, d) => toggleNote(n, 2, d), "");
  const svg = boardSvg(makeGame({ notes, wrong: setAt("0".repeat(81), 3, "1") }));
  const contents = [...svg.matchAll(/>([^<]+)</g)].map((m) => m[1]);

  expect(contents.length).toBeGreaterThan(0);

  for (const c of contents) expect(c).toMatch(/^[0-9A-I]$/);
});
