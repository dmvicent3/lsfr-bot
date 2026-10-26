import { MessageFlags } from "discord.js";
import { reply } from "../../../core/replies.ts";
import { MangaDexError } from "../api/client.ts";
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

async function followOrExplain({ i, db, repo, get }: CommandCtx): Promise<string> {
  try {
    const result = await followManga(
      { repo, get, now: Date.now() },
      { userId: i.user.id, mangaId: i.options.getString("title", true).trim() },
    );

    return followReply(result, mangaChannel(db) !== null);
  } catch (err) {
    if (err instanceof MangaDexError) return "MangaDex isn't answering; try again in a bit.";

    throw err;
  }
}

/** The title option's value is a MangaDex id picked from autocomplete. */
export async function follow(c: CommandCtx): Promise<void> {
  await c.i.deferReply({ flags: MessageFlags.Ephemeral });
  await reply(c.i, await followOrExplain(c));
}
