import { reply } from "../../../core/replies.ts";
import { memberName } from "../../trivia/commands/name.ts";
import { JOINS } from "../components/replies.ts";
import { playingElsewhere } from "../session/registry.ts";
import { startShed } from "../session/start.ts";
import type { CommandCtx } from "./types.ts";

/** `/shed new`: opens the lobby (posted by the game itself); the command reply stays private. */
export async function open({ i, guildId, ctx, random }: CommandCtx): Promise<void> {
  const p = {
    guildId,
    channelId: i.channelId,
    userId: i.user.id,
    name: memberName(i),
    stacking: i.options.getBoolean("stacking") ?? true,
    now: Date.now(),
  };
  await i.deferReply({ flags: "Ephemeral" });

  if (playingElsewhere(guildId, p.userId, p.channelId)) return reply(i, JOINS.elsewhere);

  if ((await startShed(ctx, p, random)) === "busy")
    return reply(i, "A game is already running here.");

  await reply(i, "Lobby open. Get people to press **Join**, then press **Start**.");
}
