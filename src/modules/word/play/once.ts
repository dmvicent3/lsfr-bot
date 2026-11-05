import type { Database } from "bun:sqlite";

/** Thrown inside the transaction when another call finished the game first. */
export class AlreadyFinished extends Error {}

/**
 * Runs one move read to write in one transaction, so a game finishes (and scores) once; a move
 * that lost the race to another finish comes back as `finished`.
 */
export function once<T>(db: Database, move: () => T, finished: () => T): T {
  try {
    return db.transaction(move)();
  } catch (err) {
    if (err instanceof AlreadyFinished) return finished();

    throw err;
  }
}
