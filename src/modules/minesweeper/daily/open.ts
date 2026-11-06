import { seedFor } from "../../../core/seed.ts";
import { startGame } from "../moves.ts";
import { PRESETS } from "../setup.ts";
import type { GameStore } from "../store/games.ts";
import type { CellState, Controls, Game, NewGame, Preset } from "../types.ts";
import { bbbv } from "./bbbv.ts";
import { dailyMap } from "./map.ts";

export interface OpenDaily {
  guildId: string;
  channelId: string;
  playerId: string;
  date: string;
  level: Preset;
  controls: Controls;
  now: number;
}

/** A fresh daily on the day's shared map: its opening already open, the clock not running. */
export function freshDaily(o: OpenDaily): NewGame {
  const setup = PRESETS[o.level];
  const map = dailyMap(setup, seedFor(o.guildId, `${o.date}:${o.level}`));
  const opened = new Set(map.open);
  const base = startGame({ ...o, setup });
  const cells = base.cells.map((c, i): CellState => (opened.has(i) ? "open" : c));

  return {
    ...base,
    kind: "daily",
    date: o.date,
    level: o.level,
    field: map.field,
    cells,
    cursor: map.opening,
    bbbv: bbbv(map.field, cells, setup.width, setup.height),
  };
}

/** Today's daily for the player: the one already open or finished, else a fresh one. */
export function openDaily(store: GameStore, o: OpenDaily): Game {
  return store.dailies.on(o.guildId, o.playerId, o.date) ?? store.insert(freshDaily(o));
}
