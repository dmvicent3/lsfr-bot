import { layMines } from "./field.ts";
import { toggleFlag } from "./flag.ts";
import { colOf, rowOf, toIndex } from "./grid.ts";
import { isWon } from "./outcome.ts";
import { revealAt } from "./reveal.ts";
import type { Axis, Controls, Game, NewGame, Setup, Step } from "./types.ts";

interface StartOptions {
  guildId: string;
  channelId: string;
  playerId: string;
  setup: Setup;
  controls: Controls;
  now: number;
}

export function startGame(o: StartOptions): NewGame {
  const { width, height } = o.setup;

  return {
    ...o.setup,
    guildId: o.guildId,
    channelId: o.channelId,
    messageId: null,
    playerId: o.playerId,
    field: null,
    cells: Array.from({ length: width * height }, () => "hidden"),
    cursor: toIndex(Math.floor(width / 2), Math.floor(height / 2), width),
    hit: null,
    result: null,
    createdAt: o.now,
    startedAt: null,
    finishedAt: null,
    controls: o.controls,
  };
}

export const isStarted = (game: Game): boolean => game.startedAt !== null;

export function moveCursor(game: Game, axis: Axis, value: number): Game {
  const col = axis === "col" ? value : colOf(game.cursor, game.width);
  const row = axis === "row" ? value : rowOf(game.cursor, game.width);

  return { ...game, cursor: toIndex(col, row, game.width) };
}

/** Lays the mines around the cursor on the first reveal and starts the clock. */
function laid(game: Game, now: number, random: () => number): Game & { field: boolean[] } {
  if (game.field) return { ...game, field: game.field };

  return { ...game, field: layMines(game, game.cursor, random), startedAt: now };
}

export function applyReveal(game: Game, now: number, random: () => number): Step {
  const ready = laid(game, now, random);
  const step = revealAt(ready, game.cursor);

  if (step.hint) return { game, hint: step.hint };

  const next = { ...ready, cells: step.cells };

  if (step.hit !== null) {
    return { game: { ...next, hit: step.hit, result: "lost", finishedAt: now }, hint: null };
  }

  if (!isWon(ready.field, step.cells)) return { game: next, hint: null };

  const cells = step.cells.map((c, i) => (ready.field[i] ? "flag" : c));

  return { game: { ...next, cells, result: "won", finishedAt: now }, hint: null };
}

export function applyFlag(game: Game): Step {
  const { cells, hint } = toggleFlag(game.cells, game.cursor);

  return hint ? { game, hint } : { game: { ...game, cells }, hint: null };
}

export const applyGiveUp = (game: Game, now: number): Game => ({
  ...game,
  result: "gave-up",
  finishedAt: now,
});
