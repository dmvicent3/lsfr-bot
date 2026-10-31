import type { Outgoing } from "../../trivia/session/types.ts";
import { points } from "../game/points.ts";
import type { Game } from "../game/types.ts";
import { boardMessage, secondsLeft } from "../render/board.ts";
import { lobbyMessage } from "../render/lobby.ts";
import type { Deps, Live } from "./types.ts";

/** What the game's message shows now: the lobby, or the board. */
export const current = (g: Game, now: number): Outgoing =>
  g.phase === "lobby" ? lobbyMessage(g) : boardMessage(g, now);

/** Posts the game's message and remembers it, here and in the row. */
export async function openMessage(l: Live, d: Deps, now: number): Promise<void> {
  const sent = await d.poster.post(current(l.game, now));
  l.lost ||= sent.result === "lost-channel";

  if (sent.result !== "ok") return;

  l.messageId = sent.messageId;
  d.repo.games.setMessage(l.game.id, sent.messageId);
}

/** Edits the message to the current state when something changed (or `force`). */
export async function refresh(l: Live, d: Deps, now: number, force = false): Promise<void> {
  if (!l.messageId || !(l.dirty || force)) return;

  l.dirty = false;
  l.shownSeconds = l.game.phase === "playing" ? secondsLeft(l.game, now) : null;
  await d.poster.edit(l.messageId, current(l.game, now));
}

/** Ends the game once: places saved when it played out, the row closed, the final board. */
export async function finish(l: Live, d: Deps, now: number): Promise<void> {
  if (l.ended) return;

  const g = l.game;
  l.ended = true;

  if (g.phase !== "over") {
    g.phase = "over";
    g.endReason = "lost";
  }

  if (g.endReason === "done") d.repo.places.add(g.id, g.guildId, now, points(g));

  d.repo.games.end(g.id, now, g.turnNo > 0 ? g.seats.length : null);

  if (!l.lost && l.messageId) await refresh(l, d, now, true);
  else if (!l.lost) await openMessage(l, d, now);

  d.onEnd();
}
