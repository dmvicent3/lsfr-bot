import { reply } from "../../../core/replies.ts";
import { closeBoard } from "../close.ts";
import { applyGiveUp, isStarted, startGame } from "../moves.ts";
import { renderBoard } from "../render/board.ts";
import { resolveSetup } from "../setup.ts";
import type { Preset, Setup, SetupOptions } from "../types.ts";
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

/** Ends the player's live game: a started one is given up, an untouched one dropped. */
async function endLive(c: CommandCtx): Promise<void> {
  const live = c.store.live(c.guildId, c.i.user.id);

  if (!live) return;

  const started = isStarted(live);
  const final = started ? applyGiveUp(live, Date.now()) : live;

  if (started) c.store.save(final);
  else c.store.remove(live.id);

  const o = { playerName: c.i.user.displayName, note: "Replaced by a new game." };
  await closeBoard(c.ctx.client, final, o);
}

async function begin(c: CommandCtx, setup: Setup): Promise<void> {
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
  c.store.insert({ ...game, messageId: message.id });
}

export async function play(c: CommandCtx): Promise<void> {
  const setup = resolveSetup(options(c));

  if ("refusal" in setup) return reply(c.i, setup.refusal);

  await c.i.deferReply();
  await endLive(c);
  await begin(c, setup);
}
