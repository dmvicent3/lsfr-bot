import { discCount, drop, emptyBoard, isFull, landingRow, winLine, winnerOf } from "./board.ts";
import type { Disc, Game, MoveError, Moved, NewGame, Outcome } from "./types.ts";

export const ABANDON_MS = 10 * 60_000;

export const PLAYER: Disc = "R";

export const JEVOS: Disc = "Y";

/** A fresh game; a coin flip decides who drops first. */
export const startGame = (g: NewGame): Game => ({
  guildId: g.guildId,
  playerId: g.playerId,
  channelId: g.channelId,
  messageId: null,
  board: emptyBoard(),
  first: g.random() < 0.5 ? "jevos" : "player",
  difficulty: g.difficulty,
  startedAt: g.now,
  updatedAt: g.now,
});

/** Equal discs means whoever went first is up. */
export function jevosToMove(game: Game): boolean {
  const even = discCount(game.board, PLAYER) === discCount(game.board, JEVOS);

  return even === (game.first === "jevos");
}

export function outcomeOf(game: Game): Outcome {
  const line = winLine(game.board);

  if (line) {
    const winner = winnerOf(game.board) === JEVOS ? "jevos" : "player";

    return { kind: "win", winner, line };
  }

  return isFull(game.board) ? { kind: "draw" } : { kind: "playing" };
}

function dropped(game: Game, col: number, d: Disc, now: number): Moved {
  const next = { ...game, board: drop(game.board, col, d), updatedAt: now };

  return { game: next, outcome: outcomeOf(next) };
}

export function playerDrop(game: Game, col: number, now: number): Moved | { error: MoveError } {
  if (outcomeOf(game).kind !== "playing") return { error: "over" };

  if (jevosToMove(game)) return { error: "not-your-turn" };

  if (landingRow(game.board, col) === null) return { error: "full" };

  return dropped(game, col, PLAYER, now);
}

export const jevosDrop = (game: Game, col: number, now: number): Moved =>
  dropped(game, col, JEVOS, now);

export const playerMoves = (game: Game): number => discCount(game.board, PLAYER);

/**
 * What a touch (a click, or the player's next /four play) finds, under the player's lock: idle
 * 10 minutes, waiting on a jevos move nobody is making (a restart or a failed update), or theirs.
 */
export function touch(game: Game, now: number): "idle" | "jevos" | "play" {
  if (now - game.updatedAt >= ABANDON_MS) return "idle";

  return jevosToMove(game) ? "jevos" : "play";
}
