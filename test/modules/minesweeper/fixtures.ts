import type { Board, CellState, Game } from "../../../src/modules/minesweeper/types.ts";

const STATE: Record<string, CellState> = {
  "*": "hidden",
  ".": "hidden",
  o: "open",
  F: "flag",
  f: "flag",
};

/** A board from a picture: `*` mine, `.` hidden, `o` open, `F` flag on a mine, `f` flag on a safe cell. */
export function board(rows: string[], opts: Partial<Board> = {}): Board {
  const chars = rows.join("").split("");
  const field = chars.map((c) => c === "*" || c === "F");

  return {
    width: rows[0]?.length ?? 0,
    height: rows.length,
    mines: field.filter(Boolean).length,
    field,
    cells: chars.map((c) => STATE[c] ?? "hidden"),
    cursor: 0,
    hit: null,
    result: null,
    ...opts,
  };
}

/** A live game around a board picture. */
export function game(rows: string[], opts: Partial<Game> = {}): Game {
  return {
    ...board(rows),
    id: 1,
    guildId: "g",
    channelId: "c",
    messageId: "m",
    playerId: "u",
    createdAt: 0,
    startedAt: 1_000,
    finishedAt: null,
    controls: "menus",
    ...opts,
  };
}

/** Deterministic random in [0, 1). */
export function seeded(seed: number): () => number {
  let s = seed;

  return () => {
    s = (s * 1_103_515_245 + 12_345) % 2_147_483_648;

    return s / 2_147_483_648;
  };
}
