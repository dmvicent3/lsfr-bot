import { expect, test } from "bun:test";
import {
  LEFT_AT,
  PLACING_AT,
  RIGHT_AT,
  battleSvg,
  fleetSvg,
} from "../../../../src/modules/fleet/render/grids-svg.ts";
import { CELL, COLOURS } from "../../../../src/modules/fleet/render/svg-grid.ts";
import type { Point } from "../../../../src/modules/fleet/render/types.ts";
import type { Game } from "../../../../src/modules/fleet/types.ts";
import { playing, rowsFleet } from "../fixtures.ts";

// rowsFleet: Flagship A1–E1 (0–4), Cruiser row 3 (20–23), Frigate row 5 (40–42),
// Submarine row 7 (60–62), Patrol boat row 9 (80–81).

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

const allTexts = (svg: string): number => svg.match(/<text /g)?.length ?? 0;

const corner = (at: Point, c: number): Point => ({
  x: at.x + (c % 10) * CELL,
  y: at.y + Math.floor(c / 10) * CELL,
});

/** The base fill of cell `c` in the grid drawn at `at`. */
function fillAt(svg: string, at: Point, c: number): string | undefined {
  const { x, y } = corner(at, c);
  const re = new RegExp(`<rect x="${x}" y="${y}" width="30" height="30" fill="([^"]+)"/>`);

  return re.exec(svg)?.[1];
}

const has = (svg: string, at: Point, c: number, rest: string): boolean => {
  const { x, y } = corner(at, c);

  return svg.includes(`<rect x="${x}" y="${y}" width="30" height="30" ${rest}/>`);
};

const outlines = (svg: string): number =>
  svg.match(/stroke="#f5c211" stroke-width="3"/g)?.length ?? 0;

const previews = (svg: string): number => svg.match(/fill-opacity="0.6"/g)?.length ?? 0;

/** The white dot of a miss in cell `c`. */
const dot = (at: Point, c: number): string => {
  const { x, y } = corner(at, c);

  return `<circle cx="${x + 15}" cy="${y + 15}" r="5" fill="#fff"/>`;
};

/** The two strokes of a ✕ in cell `c`. */
const cross = (svg: string, at: Point, c: number, colour: string): number => {
  const { x, y } = corner(at, c);
  const line = new RegExp(
    `<line x1="(${x + 8}|${x + 22})" y1="${y + 8}" x2="(${x + 22}|${x + 8})" y2="${y + 22}" stroke="${colour}" stroke-width="2.5"`,
    "g",
  );

  return svg.match(line)?.length ?? 0;
};

const LABELS = "ABCDEFGHIJ12345678910";

const PREVIEW = 'fill="#f5c211" fill-opacity="0.6"';

const placing = (over: Partial<Game> = {}): Game =>
  playing({ phase: "placing", player: { ships: [], shots: [] }, ...over });

test("battle: two grids side by side under their titles, white background, DejaVu Sans", () => {
  const svg = battleSvg(playing(), { reveal: false });

  expect(svg).toStartWith('<svg xmlns="http://www.w3.org/2000/svg" width="684" height="366"');
  expect(svg).toContain('font-family="DejaVu Sans"');
  expect(svg).toContain('<rect width="684" height="366" fill="#fff"/>');
  expect(RIGHT_AT.x - (LEFT_AT.x + 10 * CELL)).toBe(40);
  const titles = texts(svg).filter((t) => t.size === 16);
  expect(titles).toEqual([
    { x: LEFT_AT.x + 150, y: 28, size: 16, bold: true, fill: "#111", text: "jevos's waters" },
    { x: RIGHT_AT.x + 150, y: 28, size: 16, bold: true, fill: "#111", text: "your fleet" },
  ]);
});

test("labels: A–J over each grid and 1–10 down its left, 13 px grey; nothing else is text", () => {
  const svg = battleSvg(playing(), { reveal: false });
  const labels = texts(svg).filter((t) => t.size === 13);

  expect(labels.map((t) => t.text).join("")).toBe(LABELS + LABELS);
  expect(labels.every((t) => t.fill === "#555" && !t.bold)).toBe(true);
  expect(labels[0]).toMatchObject({ x: LEFT_AT.x + 15 });
  expect(labels[10]).toMatchObject({ x: LEFT_AT.x - 10, y: LEFT_AT.y + 20 });
  expect(labels[20]).toMatchObject({ x: RIGHT_AT.x + 15 });
  expect(allTexts(svg)).toBe(40 + 2);
});

test("grid lines are 1 px dark blue, 11 each way per grid", () => {
  const svg = battleSvg(playing(), { reveal: false });

  expect(svg.match(/stroke="#0b3d5c" stroke-width="1"/g)).toHaveLength(44);
});

test("placing: your grid only, no titles", () => {
  const svg = fleetSvg(placing(), { preview: false });

  expect(svg).toStartWith('<svg xmlns="http://www.w3.org/2000/svg" width="344" height="342"');
  expect(
    texts(svg)
      .map((t) => t.text)
      .join(""),
  ).toBe(LABELS);
  expect(allTexts(svg)).toBe(20);
  expect(svg.match(/stroke="#0b3d5c" stroke-width="1"/g)).toHaveLength(22);
  expect(fillAt(svg, PLACING_AT, 0)).toBe(COLOURS.water);
  expect(outlines(svg)).toBe(0);
});

test("placing: placed ships grey, the next ship's preview yellow from the cursor", () => {
  const g = placing({ cursor: 22, player: { ships: rowsFleet().slice(0, 1), shots: [] } });
  const svg = fleetSvg(g, { preview: true });

  expect(fillAt(svg, PLACING_AT, 0)).toBe(COLOURS.ship);
  expect(previews(svg)).toBe(4);

  for (const c of [22, 23, 24, 25]) expect(has(svg, PLACING_AT, c, PREVIEW)).toBe(true);

  expect(has(svg, PLACING_AT, 26, PREVIEW)).toBe(false);
  expect(previews(fleetSvg(g, { preview: false }))).toBe(0);
});

test("placing: a ship that won't fit previews just the cursor; a full fleet none", () => {
  const down = placing({ cursor: 70, dir: "down" });
  expect(previews(fleetSvg(down, { preview: true }))).toBe(1);
  expect(has(fleetSvg(down, { preview: true }), PLACING_AT, 70, PREVIEW)).toBe(true);
  const full = placing({ player: { ships: rowsFleet(), shots: [] } });
  expect(previews(fleetSvg(full, { preview: true }))).toBe(0);
});

test("the firing cursor is a yellow outline on jevos's waters, only on your shot", () => {
  const svg = battleSvg(playing({ cursor: 57 }), { reveal: false });
  expect(outlines(svg)).toBe(1);
  expect(has(svg, LEFT_AT, 57, 'fill="none" stroke="#f5c211" stroke-width="3"')).toBe(true);
  const aiming = playing({ cursor: 57, player: { ships: rowsFleet(), shots: [11] } });
  expect(outlines(battleSvg(aiming, { reveal: false }))).toBe(0);
  expect(outlines(battleSvg(playing(), { reveal: true }))).toBe(0);
  expect(previews(svg)).toBe(0);
});

test("misses, hits and sunk ships at their cells on both grids", () => {
  const g = playing({
    player: { ships: rowsFleet(), shots: [11, 42, 80, 81] },
    jevos: { ships: rowsFleet(), shots: [0, 99, 3] },
  });
  const svg = battleSvg(g, { reveal: false });

  expect(fillAt(svg, LEFT_AT, 11)).toBe(COLOURS.water);
  expect(svg).toContain(dot(LEFT_AT, 11));
  expect(fillAt(svg, LEFT_AT, 42)).toBe(COLOURS.hit);
  expect(cross(svg, LEFT_AT, 42, "#3b1d00")).toBe(2);
  expect(fillAt(svg, LEFT_AT, 80)).toBe(COLOURS.sunk);
  expect(cross(svg, LEFT_AT, 81, "#fff")).toBe(2);
  expect(fillAt(svg, LEFT_AT, 40)).toBe(COLOURS.water);
  expect(fillAt(svg, RIGHT_AT, 0)).toBe(COLOURS.hit);
  expect(fillAt(svg, RIGHT_AT, 1)).toBe(COLOURS.ship);
  expect(svg).toContain(dot(RIGHT_AT, 99));
  expect(svg.match(/<circle /g)).toHaveLength(2);
  expect(svg.match(/stroke-width="2.5"/g)).toHaveLength(2 * 5);
});

test("reveal shows jevos's unhit ships, only when the game is over", () => {
  const g = playing({ player: { ships: rowsFleet(), shots: [42] } });

  expect(fillAt(battleSvg(g, { reveal: false }), LEFT_AT, 20)).toBe(COLOURS.water);
  expect(fillAt(battleSvg(g, { reveal: true }), LEFT_AT, 20)).toBe(COLOURS.ship);
  expect(fillAt(battleSvg(g, { reveal: true }), LEFT_AT, 42)).toBe(COLOURS.hit);
});

test("colours", () => {
  expect(COLOURS).toMatchObject({
    water: "#3d8fd1",
    ship: "#c0c4c8",
    hit: "#f08a24",
    sunk: "#c01c28",
  });
});
