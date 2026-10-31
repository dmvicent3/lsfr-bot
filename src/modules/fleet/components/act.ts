import type { MessageComponentInteraction } from "discord.js";
import type { Ctx } from "../../../core/types.ts";
import { startThinking, stopThinking } from "../../four/thinking.ts";
import { fleetKey } from "../commands/play.ts";
import type { PlayDeps } from "../commands/types.ts";
import { jevosToMove, outcomeOf, touch } from "../game.ts";
import { cellName } from "../grid.ts";
import { renderGame } from "../render/board.ts";
import { settle } from "../settle.ts";
import { FleetRepo } from "../store/repo.ts";
import type { Game, Moved } from "../types.ts";
import { postFleet, syncFleet } from "./fleet-message.ts";
import { liveGameFor, tell } from "./guard.ts";
import { type Turn, answer } from "./turn.ts";

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
  await t.i.update(renderGame(view));
  await syncFleet(t.i.channel, view);
}

/** Firing starts at Ready: the player's own grid goes in a message of its own. */
async function started(t: Turn, before: Game, moved: Moved): Promise<Moved> {
  if (before.phase !== "placing" || moved.game.phase !== "playing") return moved;

  return { ...moved, game: await postFleet(t.i, moved.game) };
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

  const moved = await started(
    t,
    game,
    "outcome" in next ? next : { game: next, outcome: outcomeOf(next) },
  );

  if (moved.outcome.kind === "playing" && jevosToMove(moved.game)) return answer(t, moved);

  settle(t.repo, moved, now);
  await t.i.update(renderGame({ ...moved, aiming: false }));

  if (moved.outcome.kind !== "playing") await syncFleet(t.i.channel, { ...moved, aiming: false });
}

/** Runs one control on the clicker's live game, under their lock. */
export async function act(
  i: MessageComponentInteraction,
  c: { ctx: Ctx; d: PlayDeps },
  change: Change,
): Promise<void> {
  const repo = new FleetRepo(c.ctx.db);
  const game = await liveGameFor(i, repo);

  if (!game) return;

  const key = fleetKey(game.guildId, game.playerId);

  if (!startThinking(key)) {
    return tell(i, touch(game, Date.now()) === "jevos" ? "jevos is still aiming." : "One moment…");
  }

  try {
    await apply({ i, repo, d: c.d }, game, change);
  } finally {
    stopThinking(key);
  }
}
