import { expect, test } from "bun:test";
import { solutionOf } from "../../../../src/modules/crossword/play/cells.ts";
import { COLOURS, gridSvg } from "../../../../src/modules/crossword/render/grid-svg.ts";
import { square } from "../play/fixtures.ts";
import { bigStored } from "./fixtures.ts";

const P = square();
const SOL = solutionOf(P);
const EMPTY = ".".repeat(25);

/** Every `<text>` as [x, y, fill, content]. */
const texts = (svg: string) =>
  [...svg.matchAll(/<text x="([\d.]+)" y="([\d.]+)"[^>]*fill="([^"]+)">([^<]*)<\/text>/g)].map(
    (m) => ({ x: Number(m[1]), y: Number(m[2]), fill: m[3], text: m[4] ?? "" }),
  );
const letters = (svg: string) => texts(svg).filter((t) => /^[A-Z]$/.test(t.text));
const numbers = (svg: string) => texts(svg).filter((t) => /^\d+$/.test(t.text));

test("size: 64 px cells inside a 4 px margin, white background, DejaVu Sans", () => {
  const svg = gridSvg(P, EMPTY, false);

  expect(svg).toStartWith('<svg xmlns="http://www.w3.org/2000/svg" width="328" height="328"');
  expect(svg).toContain('font-family="DejaVu Sans"');
  expect(svg).toContain('<rect width="328" height="328" fill="#fff"/>');
});

test("clue numbers sit at the top-left of each slot start", () => {
  const n = numbers(gridSvg(P, EMPTY, false));

  expect(n.map((t) => t.text)).toEqual(["1", "2", "3", "4", "5", "6", "7", "8", "9"]);
  expect(n[0]).toEqual({ x: 9, y: 21, fill: "#333", text: "1" });
  expect(n[5]).toMatchObject({ x: 9, y: 85, text: "6" });
  expect(n[4]).toMatchObject({ x: 4 + 4 * 64 + 5, y: 21, text: "5" });
});

test("blocks are filled dark; white cells white with dark borders", () => {
  const p = { ...P, blocks: [6] };
  const svg = gridSvg(p, `${EMPTY.slice(0, 6)}#${EMPTY.slice(7)}`, false);

  expect(svg).toContain('<rect x="68" y="68" width="64" height="64" fill="#111" stroke="#111"');
  expect(svg.match(/fill="#fff" stroke="#111" stroke-width="2"/g)).toHaveLength(24);
});

test("an empty board shows no letters", () => {
  expect(letters(gridSvg(P, EMPTY, false))).toEqual([]);
});

test("typed letters dark, revealed ones blue, centred on the baseline", () => {
  const out = letters(gridSvg(P, `cR${".".repeat(23)}`, false));

  expect(out).toEqual([
    { x: 36, y: 4 + 0.78 * 64, fill: COLOURS.typed, text: "C" },
    { x: 100, y: 4 + 0.78 * 64, fill: COLOURS.revealed, text: "R" },
  ]);
  expect(COLOURS).toEqual({ typed: "#111", revealed: "#1a5fb4", missed: "#c01c28" });
});

test("finished and solved: every cell shows the solution, none red", () => {
  const out = letters(gridSvg(P, `C${SOL.slice(1)}`, true));

  expect(out.map((t) => t.text).join("")).toBe(SOL.toUpperCase());
  expect(out.filter((t) => t.fill === COLOURS.missed)).toEqual([]);
  expect(out[0]?.fill).toBe(COLOURS.revealed);
});

test("a give-up shows the solution, red where a cell was empty or wrong", () => {
  const cells = `zR${SOL.slice(2, 20)}.....`;
  const out = letters(gridSvg(P, cells, true));

  expect(out.map((t) => t.text).join("")).toBe(SOL.toUpperCase());
  expect(out.filter((t) => t.fill === COLOURS.missed)).toHaveLength(6);
  expect(out[0]).toMatchObject({ text: "C", fill: COLOURS.missed });
  expect(out[1]).toMatchObject({ text: "R", fill: COLOURS.revealed });
  expect(out[2]?.fill).toBe(COLOURS.typed);
});

test("text content is only A–Z and digits, so nothing needs escaping", () => {
  const big = bigStored().puzzle;
  const svgs = [
    gridSvg(P, `z.R${SOL.slice(3)}`, false),
    gridSvg(P, EMPTY, true),
    gridSvg(big, solutionOf(big), true),
  ];

  for (const svg of svgs) {
    const contents = [...svg.matchAll(/>([^<]+)</g)].map((m) => m[1]);

    expect(contents.length).toBeGreaterThan(0);

    for (const c of contents) expect(c).toMatch(/^[A-Z0-9]+$/);
  }
});
