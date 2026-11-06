import { MessageFlags } from "discord.js";
import { dateIn } from "../../../core/zoned.ts";
import { openDaily } from "../daily/open.ts";
import { pickDaily } from "../daily/pick.ts";
import { renderBoard } from "../render/board.ts";
import { minesweeperTimeZone } from "../settings.ts";
import type { CommandCtx } from "./types.ts";
import { toControls, toPreset } from "./options.ts";

/** Private: today's board at the level picked on the day's first open, finished or not. */
export async function daily({ i, guildId, ctx, store }: CommandCtx): Promise<void> {
  await i.deferReply({ flags: MessageFlags.Ephemeral });

  const now = Date.now();
  const date = dateIn(now, minesweeperTimeZone(ctx.db, guildId));
  const pick = pickDaily(
    store.dailies.on(guildId, i.user.id, date),
    toPreset(i.options.getString("difficulty")),
  );
  const game = openDaily(store, {
    guildId,
    channelId: i.channelId,
    playerId: i.user.id,
    date,
    level: pick.level,
    controls: toControls(i.options.getString("controls")),
    now,
  });
  const message = await i.editReply(renderBoard(game, { playerName: i.user.displayName, now }));
  store.setMessage(game.id, message.id);

  if (pick.note) await i.followUp({ content: pick.note, flags: MessageFlags.Ephemeral });
}
