import { MessageFlags } from "discord.js";
import { reply } from "../../../core/replies.ts";
import { followManga } from "../follow.ts";
import { mangaChannel } from "../settings.ts";
import type { FollowResult } from "../types.ts";
import type { CommandCtx } from "./types.ts";

const NO_CHANNEL = "\nAn admin needs to set a channel with `/manga channel`.";

const REPLIES: Record<FollowResult["kind"], (title: string, channelSet: boolean) => string> = {
  followed: (title, channelSet) => `📚 Following **${title}**.${channelSet ? "" : NO_CHANNEL}`,
  already: (title) => `Already following **${title}**.`,
  limit: () => "You follow 100 manga already; unfollow one first.",
  "not-found": () => "Couldn't find that manga; pick one from the list.",
};

function followReply(result: FollowResult, channelSet: boolean): string {
  return REPLIES[result.kind]("title" in result ? result.title : "", channelSet);
}

/** The title option's value is a MangaDex id picked from autocomplete. */
export async function follow({ i, db, repo, get }: CommandCtx): Promise<void> {
  await i.deferReply({ flags: MessageFlags.Ephemeral });
  const result = await followManga(
    { repo, get, now: Date.now() },
    { userId: i.user.id, mangaId: i.options.getString("title", true).trim() },
  );
  await reply(i, followReply(result, mangaChannel(db) !== null));
}
