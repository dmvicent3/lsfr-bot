import type { CommandCtx } from "./types.ts";
import type { ChatInputCommandInteraction } from "discord.js";
import { reply } from "./kit.ts";
import { confirmation } from "../render.ts";
import { newReminder } from "../rules.ts";
import type { Target } from "../types.ts";

/** The `who` option as a target: a role, a member, or null when not given. */
function targetOf(i: ChatInputCommandInteraction): Target | null {
  const who = i.options.get("who");

  if (who?.role) return { kind: "role", id: who.role.id };

  if (who?.user) return { kind: "user", id: who.user.id };

  return null;
}

export async function set({ i, guildId, store }: CommandCtx): Promise<void> {
  const made = newReminder({
    guildId,
    channelId: i.channelId,
    authorId: i.user.id,
    when: i.options.getString("when", true),
    what: i.options.getString("what", true),
    who: targetOf(i),
    now: Date.now(),
    pending: store.pendingByAuthor(guildId, i.user.id).length,
  });

  await reply(i, "error" in made ? made.error : confirmation(store.add(made.reminder)));
}
