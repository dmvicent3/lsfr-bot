import { expect, test } from "bun:test";
import { renderGame } from "../../../src/modules/fleet/render/board.ts";
import { renderStats } from "../../../src/modules/fleet/render/boards.ts";
import { renderFleet } from "../../../src/modules/fleet/render/fleet.ts";
import { ownGrid, targetGrid } from "../../../src/modules/fleet/render/grid.ts";
import type { GameView } from "../../../src/modules/fleet/render/types.ts";
import { playing, rowsFleet } from "./fixtures.ts";

const SHIP_CELLS = rowsFleet().flatMap((s) => s.cells);

const placing = playing({ phase: "placing", player: { ships: [], shots: [] } });

const view = (over: Partial<GameView>): GameView => ({
  game: playing(),
  outcome: { kind: "playing" },
  aiming: false,
  ...over,
});

const ids = (v: GameView): string[] =>
  renderGame(v).components.flatMap((r) =>
    r.components.map((c) => ("custom_id" in c ? c.custom_id : "")),
  );

const text = (v: GameView): string => renderGame(v).embeds[0]?.description ?? "";

const segmenter = new Intl.Segmenter();

const cells = (line: string): number =>
  [...segmenter.segment(line)].filter((s) => s.segment !== "​").length;

test("grids are 11 lines of 11 cells and never pair regional indicators", () => {
  for (const grid of [ownGrid(playing(), false), targetGrid(playing(), false)]) {
    const lines = grid.split("\n");
    expect(lines).toHaveLength(11);
    expect(lines.map(cells)).toEqual(Array.from({ length: 11 }, () => 11));
    expect(grid).not.toMatch(/[\u{1F1E6}-\u{1F1FF}]{2}/u);
  }
});

test("placing shows the next ship and a preview", () => {
  const v = view({ game: placing });
  expect(ownGrid(placing, true).split("\n")[1]).toBe(`1️⃣${"🟨".repeat(5)}${"🟦".repeat(5)}`);
  expect(text(v)).toContain("Place your Flagship (5)");
  expect(ids(v)).toEqual(expect.arrayContaining(["fleet:row", "fleet:col", "fleet:place"]));
  expect(ids(v)).not.toContain("fleet:ready");
  const full = { ...placing, player: { ships: rowsFleet(), shots: [] } };
  expect(text(view({ game: full }))).toContain("Fleet ready: press Ready.");
  expect(ids(view({ game: full }))).toContain("fleet:ready");
});

test("playing: the board shows jevos's waters, the fleet message shows yours", () => {
  const g = playing({
    player: { ships: rowsFleet(), shots: [42] },
    jevos: { ships: rowsFleet(), shots: [0] },
  });
  const t = text(view({ game: g }));
  expect(t).toContain("**jevos's waters**");
  expect(t).not.toContain("Your fleet");
  expect(t).toContain("You fired at C5: hit!");
  expect(t).toContain("jevos fired at A1: hit!");
  expect(t).toContain("Your shot.");
  expect(ids(view({ game: g }))).toEqual(["fleet:row", "fleet:col", "fleet:fire", "fleet:resign"]);
  const fleet = renderFleet(view({ game: g }));
  expect(fleet.embeds[0]?.title).toBe("🚢 Hidden fleet — your fleet");
  expect(fleet.embeds[0]?.description).toContain("Your ships afloat:");
  expect(fleet.embeds[0]?.description).toContain("1️⃣💥⬜⬜⬜⬜");
  expect(fleet.components).toEqual([]);
});

const emoji = (s: string): number =>
  [...segmenter.segment(s)].filter((x) =>
    /\p{Extended_Pictographic}|\p{Regional_Indicator}|⃣/u.test(x.segment),
  ).length;

test("each message stays well under Discord's ~200 emoji", () => {
  const over = { kind: "win", winner: "player" } as const;

  for (const v of [view({}), view({ outcome: over })]) {
    expect(emoji(text(v))).toBeLessThanOrEqual(130);
    expect(emoji(renderFleet(v).embeds[0]?.description ?? "")).toBeLessThanOrEqual(130);
  }
});

test("a board whose fleet message could not be posted says so", () => {
  expect(text(view({ game: playing({ fleetMessageId: null }) }))).toContain(
    "Your fleet couldn't be shown here",
  );
  expect(text(view({}))).not.toContain("couldn't be shown");
});

test("the fleet message shows how the game ended", () => {
  expect(renderFleet(view({ outcome: { kind: "resigned" } })).embeds[0]?.description).toContain(
    "You resigned.",
  );
});

test("aiming keeps the controls, so a board stuck by a restart can still be clicked", () => {
  const g = playing({ player: { ships: rowsFleet(), shots: [42] } });
  const v = view({ game: g, aiming: true });
  expect(text(v)).toContain("jevos is aiming…");
  expect(ids(v)).toEqual(["fleet:row", "fleet:col", "fleet:fire", "fleet:resign"]);
});

test("a won game reveals jevos's fleet and accuracy", () => {
  const g = playing({
    player: { ships: rowsFleet(), shots: SHIP_CELLS },
    jevos: { ships: rowsFleet(), shots: [11, 12] },
  });
  const v = view({ game: g, outcome: { kind: "win", winner: "player" } });
  expect(text(v)).toContain("You sank jevos's fleet in 17 shots!");
  expect(text(v)).toContain("17/17 hits (100%)");
  expect(renderGame(v).components).toEqual([]);
  expect(targetGrid(g, true)).not.toContain("🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦\n1");
});

test("the whole board stays under 4096 characters", () => {
  const all = Array.from({ length: 100 }, (_, i) => i);
  const g = playing({
    player: { ships: rowsFleet(), shots: all.slice(0, 99) },
    jevos: { ships: rowsFleet(), shots: all.slice(1, 99) },
  });
  expect(JSON.stringify(renderGame(view({ game: g })).embeds).length).toBeLessThan(4096);
});

test("stats show each level, accuracy and how games ended", () => {
  const none = { wins: 0, losses: 0, best: null };
  const s = renderStats("a", {
    levels: { easy: { wins: 2, losses: 1, best: 31 }, normal: none, hard: none },
    shots: 90,
    hits: 38,
    resigned: 1,
    abandoned: 0,
  });
  expect(s).toContain("Easy: **2** W · **1** L · best win: 31 shots");
  expect(s).toContain("Hard: **0** W · **0** L · best win: —");
  expect(s).toContain("Accuracy: 38/90 hits (42%)");
  expect(s).toContain("Resigned: 1 · Abandoned: 0");
});

test("ships are drawn in a colour that shows on Discord's dark theme", () => {
  const row1 = ownGrid(playing(), false).split("\n")[1];
  expect(row1).toBe(`1️⃣${"⬜".repeat(5)}${"🟦".repeat(5)}`);
  expect(targetGrid(playing(), true)).not.toContain("⬛");
});
