import { emptyBoard, emptySquares, other, place, turnOf, winningLine, winner } from "./board.ts";
import type { Game, Mark, MoveError, Moved, NewGame, Outcome } from "./types.ts";

export const ABANDON_MS = 10 * 60_000;

/** A fresh game; a coin flip decides whether jevos is X, and X moves first. */
export const startGame = (g: NewGame): Game => ({
  guildId: g.guildId,
  channelId: g.channelId,
  messageId: null,
  playerId: g.playerId,
  board: emptyBoard(),
  jevosMark: g.random() < 0.5 ? "X" : "O",
  updatedAt: g.now,
});

export const jevosToMove = (game: Game): boolean => turnOf(game.board) === game.jevosMark;

export function outcomeOf(game: Game): Outcome {
  const line = winningLine(game.board);

  if (line) {
    return {
      kind: "win",
      winner: winner(game.board) === game.jevosMark ? "jevos" : "player",
      line,
    };
  }

  return emptySquares(game.board).length === 0 ? { kind: "draw" } : { kind: "playing" };
}

function moved(game: Game, square: number, mark: Mark, now: number): Moved {
  const next = { ...game, board: place(game.board, square, mark), updatedAt: now };

  return { game: next, outcome: outcomeOf(next) };
}

export function playerMove(game: Game, square: number, now: number): Moved | { error: MoveError } {
  if (outcomeOf(game).kind !== "playing") return { error: "over" };

  if (jevosToMove(game)) return { error: "not-your-turn" };

  if (game.board[square] !== null) return { error: "taken" };

  return moved(game, square, other(game.jevosMark), now);
}

export const jevosMove = (game: Game, square: number, now: number): Moved =>
  moved(game, square, game.jevosMark, now);

export const isAbandoned = (game: Game, now: number): boolean => now - game.updatedAt >= ABANDON_MS;
