import { expect, test } from "bun:test";
import {
  ABANDON_MS,
  jevosFire,
  jevosToMove,
  playerFire,
  startGame,
  touch,
} from "../../../src/modules/fleet/game.ts";
import { placeShip, randomRest, ready } from "../../../src/modules/fleet/placing.ts";
import { placingControls } from "../../../src/modules/fleet/render/controls.ts";
import type { Game, Moved } from "../../../src/modules/fleet/types.ts";
import { playing, rowsFleet } from "./fixtures.ts";

const fresh = (): Game =>
  startGame({
    guildId: "g",
    channelId: "c",
    playerId: "u",
    difficulty: "normal",
    now: 0,
    random: Math.random,
  });

function fired(r: Moved | { error: string }): Moved {
  if ("error" in r) throw new Error(r.error);

  return r;
}

function readied(r: Game | { error: string }): Game {
  if ("error" in r) throw new Error(r.error);

  return r;
}

test("a new game is placing with a full hidden jevos fleet", () => {
  const g = fresh();
  expect(g.phase).toBe("placing");
  expect(g.player.ships).toEqual([]);
  expect(g.jevos.ships).toHaveLength(5);
  expect(new Set(g.jevos.ships.flatMap((s) => s.cells)).size).toBe(17);
});

test("ready needs all five ships and flips the coin", () => {
  const g = { ...fresh(), player: { ships: rowsFleet().slice(0, 4), shots: [] } };
  expect(ready(g, () => 0.2, 1)).toEqual({ error: "unplaced" });
  const full = { ...g, player: { ships: rowsFleet(), shots: [] } };
  const jevosFirst = readied(ready(full, () => 0.2, 1));
  expect(jevosFirst.phase).toBe("playing");
  expect(jevosFirst.first).toBe("jevos");
  expect(jevosToMove(jevosFirst)).toBe(true);
  expect(readied(ready(full, () => 0.7, 1)).first).toBe("player");
});

test("strict alternation", () => {
  const one = fired(playerFire(playing(), 1));
  expect(jevosToMove(one.game)).toBe(true);
  expect(playerFire({ ...one.game, cursor: 1 }, 2)).toEqual({ error: "not-your-turn" });
  const two = jevosFire(one.game, 0, 3);
  expect(jevosToMove(two.game)).toBe(false);
  expect(fired(playerFire({ ...two.game, cursor: 1 }, 4)).game.player.shots).toEqual([0, 1]);
});

test("a cell already fired is refused", () => {
  const g = playing({
    player: { ships: rowsFleet(), shots: [0] },
    jevos: { ships: rowsFleet(), shots: [0] },
  });
  expect(playerFire(g, 1)).toEqual({ error: "fired" });
});

test("sinking the last ship wins", () => {
  const cells = rowsFleet().flatMap((s) => s.cells);
  const last = cells.pop() ?? 0;
  const g = playing({
    player: { ships: rowsFleet(), shots: cells },
    jevos: { ships: rowsFleet(), shots: cells.map((c) => c + 10) },
    cursor: last,
  });
  const won = fired(playerFire(g, 1));
  expect(won.outcome).toEqual({ kind: "win", winner: "player" });
  expect(playerFire({ ...won.game, cursor: 99 }, 2)).toEqual({ error: "over" });
});

test("touch", () => {
  const g = playing({ updatedAt: 100 });
  expect(touch(g, 100 + ABANDON_MS)).toBe("idle");
  expect(touch(g, 101)).toBe("play");
  expect(touch(playing({ first: "jevos" }), 1)).toBe("jevos");
});

test("placement controls only while placing", () => {
  expect(placeShip(playing(), 1)).toEqual({ error: "phase" });
});

test("Random fills the rest; once all five are placed it re-rolls the whole fleet", () => {
  const two = { ...fresh(), player: { ships: rowsFleet().slice(0, 2), shots: [] } };
  const filled = readied(randomRest(two, Math.random, 1));
  expect(filled.player.ships.slice(0, 2)).toEqual(rowsFleet().slice(0, 2));
  expect(filled.player.ships).toHaveLength(5);
  const full = { ...fresh(), player: { ships: rowsFleet(), shots: [] } };
  const rolled = readied(randomRest(full, Math.random, 1));
  expect(rolled.player.ships).toHaveLength(5);
  expect(new Set(rolled.player.ships.flatMap((x) => x.cells)).size).toBe(17);
  expect(rolled.player.ships).not.toEqual(rowsFleet());
});

const randomButton = (g: Game) =>
  placingControls(g)
    .flatMap((r) => r.components)
    .find((c) => "custom_id" in c && c.custom_id === "fleet:random");

test("the Random button stays on: Random while placing, Re-roll once all are placed", () => {
  expect(randomButton(fresh())).toMatchObject({ label: "Random", disabled: false });
  const full = { ...fresh(), player: { ships: rowsFleet(), shots: [] } };
  expect(randomButton(full)).toMatchObject({ label: "Re-roll", disabled: false });
});
