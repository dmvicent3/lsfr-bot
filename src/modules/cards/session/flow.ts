import type { Outgoing } from "../../trivia/session/types.ts";
import type { Change } from "../game/clock.ts";
import type { Game } from "../game/types.ts";
import { lobbyMessage } from "../render/lobby.ts";
import { overMessage, revealMessage } from "../render/reveal.ts";
import { answerOf, playingMessage, votingMessage } from "../render/round.ts";
import type { Deps, Live } from "./types.ts";

/** What the current phase's message shows now. */
export function current(g: Game): Outgoing {
  if (g.phase === "lobby") return lobbyMessage(g);

  if (g.phase === "playing") return playingMessage(g);

  if (g.phase === "voting") return votingMessage(g);

  return g.phase === "reveal" ? revealMessage(g) : overMessage(g);
}

/** Takes the buttons off the last phase's message, then posts the next one. */
export async function postPhase(l: Live, d: Deps, msg: Outgoing): Promise<void> {
  if (l.messageId) await d.poster.edit(l.messageId, { components: [] });

  const sent = await d.poster.post(msg);
  l.messageId = sent.result === "ok" ? sent.messageId : null;
  l.lost ||= sent.result === "lost-channel";
  l.dirty = false;
}

function saveWins(g: Game, d: Deps, now: number): void {
  const r = g.round;

  if (!r) return;

  const votes = (id: string): number => [...r.votes.values()].filter((a) => a === id).length;
  d.repo.wins.add(
    r.winners.map((userId) => ({
      gameId: g.id,
      guildId: g.guildId,
      userId,
      at: now,
      prompt: answerOf(r, userId),
      votes: votes(userId),
    })),
  );
}

/** Ends the game once: the row closed (winner only when the target was reached), the final post. */
export async function finish(l: Live, d: Deps, now: number): Promise<void> {
  if (l.ended) return;

  const g = l.game;
  l.ended = true;
  const top = [...g.points].toSorted((a, b) => b[1] - a[1])[0];
  d.repo.games.end(g.id, now, g.endReason === "target" && top ? top[0] : null);

  if (!l.lost) await postPhase(l, d, overMessage(g));

  d.onEnd();
}

const VOID = "Fewer than 2 answers, so that round doesn't count.";

/** Shows what the clock changed. */
export async function show(l: Live, d: Deps, change: Change, now: number): Promise<void> {
  const g = l.game;

  if (g.phase === "over") return finish(l, d, now);

  if (change === "reveal") saveWins(g, d, now);

  const msg = current(g);
  await postPhase(l, d, change === "void" ? { ...msg, content: VOID } : msg);
}
