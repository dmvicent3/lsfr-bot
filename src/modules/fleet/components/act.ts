import { tell } from "../../../core/replies.ts";
import type { MessageComponentInteraction } from "discord.js";
import type { Ctx } from "../../../core/types.ts";
import { startThinking, stopThinking } from "../../four/thinking.ts";
import { fleetKey } from "../commands/play.ts";
import type { PlayDeps } from "../commands/types.ts";
import { jevosToMove, outcomeOf, touch } from "../game.ts";
import { cellName } from "../grid.ts";
import { boardMessage } from "../board-message.ts";
import { settle } from "../settle.ts";
import { FleetRepo } from "../store/repo.ts";
import type { Game, Moved } from "../types.ts";
import { liveGameFor } from "./guard.ts";
import { type Turn, answer, followBoard } from "./turn.ts";

/** A control's effect on the game: the next game, a move with its outcome, or why not. */
export type Change = (g: Game, now: number) => Game | Moved | { error: string };

const REFUSALS: Record<string, (g: Game) => string> = {
  "off-grid": () => "That ship would run off the grid.",
  overlap: () => "That ship would overlap another.",
  fired: (g) => `You already fired at ${cellName(g.cursor)}.`,
  unplaced: () => "Place all five ships first.",
};

async function abandon(t: Turn, game: Game, now: number): Promise<void> {
  t.repo.games.finish(game, { result: "loss", how: "abandoned", endedAt: now });
  const view = { game, outcome: { kind: "abandoned" }, aiming: false } as const;
  await t.i.update(boardMessage(view));
}

async function apply(t: Turn, game: Game, change: Change): Promise<void> {
  const now = Date.now();
  const state = touch(game, now);

  if (state === "idle") return abandon(t, game, now);

  if (state === "jevos") return answer(t, { game, outcome: outcomeOf(game) });

  const next = change(game, now);

  if ("error" in next) {
    const refusal = REFUSALS[next.error];

    return refusal ? tell(t.i, refusal(game)) : void (await t.i.deferUpdate());
  }

  const moved = "outcome" in next ? next : { game: next, outcome: outcomeOf(next) };

  if (moved.outcome.kind === "playing" && jevosToMove(moved.game)) return answer(t, moved);

  settle(t.repo, moved, now);
  await t.i.update(boardMessage({ ...moved, aiming: false }));
  // The player's own shot leaves their fleet as it was: only posted if it isn't there yet.
  await followBoard(t, moved, false);
}

/** A cursor move made while jevos aims: stored, and the board shows it with jevos's shot. */
export type Queued = (g: Game, now: number) => Game;

/**
 * Runs one control on the clicker's live game, under their lock. A `queued` control (the cursor)
 * still goes through while jevos aims, without the lock: jevos's turn reads it back before its
 * shot is stored, so the move lands on the board jevos's shot brings.
 */
export async function act(
  i: MessageComponentInteraction,
  c: { ctx: Ctx; d: PlayDeps; queued?: Queued },
  change: Change,
): Promise<void> {
  const repo = new FleetRepo(c.ctx.db);
  const game = await liveGameFor(i, repo);

  if (!game) return;

  const key = fleetKey(game.guildId, game.playerId);

  if (!startThinking(key)) {
    const now = Date.now();
    const aiming = touch(game, now) === "jevos";

    if (aiming && c.queued) {
      repo.games.put(c.queued(game, now));
      await i.deferUpdate();

      return;
    }

    return tell(i, aiming ? "jevos is still aiming." : "One moment…");
  }

  try {
    await apply({ i, repo, d: c.d }, game, change);
  } finally {
    stopThinking(key);
  }
}
