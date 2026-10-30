import { PermissionFlagsBits } from "discord.js";
import { reply } from "../../../core/replies.ts";
import { kaosLists, questions } from "../data/load.ts";
import type { CommandCtx } from "./types.ts";
import { renderReports } from "./views.ts";

/** Manage Server only; checked here since the other subcommands are for everyone. */
export async function reports({ i, guildId, repo }: CommandCtx): Promise<void> {
  if (!i.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
    return reply(i, "Only members who can manage the server can see reports.");
  }

  await reply(
    i,
    renderReports(repo.reports.open(guildId), { questions: questions(), lists: kaosLists() }),
  );
}
