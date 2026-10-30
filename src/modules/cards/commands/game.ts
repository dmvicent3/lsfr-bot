import { PermissionFlagsBits } from "discord.js";
import { reply } from "../../../core/replies.ts";
import { memberName } from "../../trivia/commands/name.ts";
import { runnerIn } from "../session/registry.ts";
import { startCards } from "../session/start.ts";
import type { CommandCtx } from "./types.ts";

const DEFAULT_TARGET = 7;

/** Opens the lobby (posted by the game itself); the command reply stays private. */
export async function start({ i, guildId, ctx, random }: CommandCtx): Promise<void> {
  const p = {
    guildId,
    channelId: i.channelId,
    userId: i.user.id,
    name: memberName(i),
    target: i.options.getInteger("points") ?? DEFAULT_TARGET,
    now: Date.now(),
  };
  await i.deferReply({ flags: "Ephemeral" });

  if ((await startCards(ctx, p, random)) === "busy")
    return reply(i, "A game is already running here.");

  await reply(i, "Lobby open. Get people to press **Join**, then press **Start**.");
}

/** The starter or a Manage Server member. */
export async function stop({ i }: CommandCtx): Promise<void> {
  const runner = runnerIn(i.channelId);

  if (!runner) return reply(i, "No game is running here.");

  const manager = i.memberPermissions?.has(PermissionFlagsBits.ManageGuild) ?? false;

  if (runner.state.startedBy !== i.user.id && !manager)
    return reply(i, "Only whoever started the game, or a server manager, can stop it.");

  await runner.stop(Date.now());
  await reply(i, "Game stopped.");
}
