import { reply } from "../../../core/replies.ts";
import { closeBoard } from "../close.ts";
import { applyGiveUp, isStarted, startGame } from "../moves.ts";
import { renderBoard } from "../render/board.ts";
import { resolveSetup } from "../setup.ts";
import type { Game, NewGame, Preset, Setup, SetupOptions } from "../types.ts";
import type { CommandCtx } from "./types.ts";

const PRESET_NAMES: Record<string, Preset> = {
  beginner: "beginner",
  intermediate: "intermediate",
  expert: "expert",
};

function options({ i }: CommandCtx): SetupOptions {
  return {
    difficulty: PRESET_NAMES[i.options.getString("difficulty") ?? ""] ?? null,
    width: i.options.getInteger("width"),
    height: i.options.getInteger("height"),
    mines: i.options.getInteger("mines"),
  };
}

/**
 * Makes the posted board the player's live game, ending the one before (a started one is given
 * up, an untouched one dropped). No await inside, so two plays at once leave one live game.
 */
function swapIn(c: CommandCtx, game: NewGame): Game | null {
  const live = c.store.live(c.guildId, c.i.user.id);
  const ended = live && isStarted(live) ? applyGiveUp(live, Date.now()) : live;

  if (live && ended?.result) c.store.save(ended);
  else if (live) c.store.remove(live.id);

  c.store.insert(game);

  return ended;
}

async function post(c: CommandCtx, setup: Setup): Promise<NewGame> {
  const game = startGame({
    guildId: c.guildId,
    channelId: c.i.channelId,
    playerId: c.i.user.id,
    setup,
    now: Date.now(),
  });
  const view = renderBoard(
    { ...game, id: 0 },
    { playerName: c.i.user.displayName, now: Date.now() },
  );
  const message = await c.i.editReply({ ...view, allowedMentions: { parse: [] } });

  return { ...game, messageId: message.id };
}

export async function play(c: CommandCtx): Promise<void> {
  const setup = resolveSetup(options(c));

  if ("refusal" in setup) return reply(c.i, setup.refusal);

  await c.i.deferReply();
  const ended = swapIn(c, await post(c, setup));

  if (!ended) return;

  const note = "Replaced by a new game.";
  await closeBoard(c.ctx.client, ended, { playerName: c.i.user.displayName, note });
}
