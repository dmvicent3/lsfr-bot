import { PermissionFlagsBits } from "discord.js";
import { reply } from "../../../core/replies.ts";
import { runnerIn } from "../session/registry.ts";
import type { CommandCtx } from "./types.ts";

/** `/shed stop`: the starter or a Manage Server member; no points are given. */
export async function stop({ i }: CommandCtx): Promise<void> {
  const runner = runnerIn(i.channelId);

  if (!runner) return reply(i, "No game is running here.");

  const manager = i.memberPermissions?.has(PermissionFlagsBits.ManageGuild) ?? false;

  if (runner.state.startedBy !== i.user.id && !manager)
    return reply(i, "Only whoever started the game, or a server manager, can stop it.");

  await runner.stop(Date.now());
  await reply(i, "Game stopped. No points this time.");
}
