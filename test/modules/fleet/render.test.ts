import { expect, test } from "bun:test";
import { FLEET_FILE, renderGame } from "../../../src/modules/fleet/render/board.ts";
import { renderStats } from "../../../src/modules/fleet/render/boards.ts";
import { battleSvg, fleetSvg } from "../../../src/modules/fleet/render/grids-svg.ts";
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

const GRID_EMOJI = /[🟦⬜💥⚪🟥🟨]|\p{Regional_Indicator}|⃣/u;

test("every board shows fleet.png as its embed image and no grid emoji", () => {
  const over = { kind: "win", winner: "player" } as const;

  for (const v of [view({ game: placing }), view({}), view({ outcome: over })]) {
    expect(FLEET_FILE).toBe("fleet.png");
    expect(renderGame(v).embeds[0]?.image).toEqual({ url: "attachment://fleet.png" });
    expect(text(v)).not.toMatch(GRID_EMOJI);
  }
});

test("placing draws your grid with the preview and names the next ship", () => {
  const v = view({ game: placing });
  expect(renderGame(v).svg).toBe(fleetSvg(placing, { preview: true }));
  expect(text(v)).toContain("Place your Flagship (5)");
  expect(ids(v)).toEqual(expect.arrayContaining(["fleet:row", "fleet:col", "fleet:place"]));
  expect(ids(v)).not.toContain("fleet:ready");
  const full = { ...placing, player: { ships: rowsFleet(), shots: [] } };
  expect(text(view({ game: full }))).toContain("Fleet ready: press Ready.");
  expect(ids(view({ game: full }))).toContain("fleet:ready");
});

test("playing: both grids in one picture, both fleets afloat and the last shots in text", () => {
  const g = playing({
    player: { ships: rowsFleet(), shots: [42] },
    jevos: { ships: rowsFleet(), shots: [0] },
  });
  const t = text(view({ game: g }));
  expect(renderGame(view({ game: g })).svg).toBe(battleSvg(g, { reveal: false }));
  expect(t).toContain("jevos's ships afloat:");
  expect(t).toContain("Your ships afloat:");
  expect(t).toContain("You fired at C5: hit!");
  expect(t).toContain("jevos fired at A1: hit!");
  expect(t).toContain("Your shot.");
  expect(t).not.toContain("couldn't be shown");
  expect(ids(view({ game: g }))).toEqual(["fleet:row", "fleet:col", "fleet:fire", "fleet:resign"]);
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
  expect(renderGame(v).svg).toBe(battleSvg(g, { reveal: true }));
});

test("a resigned game says so", () => {
  expect(text(view({ outcome: { kind: "resigned" } }))).toContain("You resigned.");
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
