import type { MessageComponentInteraction, ModalSubmitInteraction } from "discord.js";
import { tell } from "../../core/replies.ts";
import type { FeedbackRepo } from "./store/repo.ts";
import { access, OUTSIDE, REFUSALS } from "./text.ts";
import type { Entry } from "./types.ts";

/** The clicked entry when the member wrote it; otherwise tells them why not and returns null. */
export async function ownEntry(
  i: MessageComponentInteraction | ModalSubmitInteraction,
  arg: string | undefined,
  repo: FeedbackRepo,
): Promise<Entry | null> {
  if (!i.guildId) {
    await tell(i, OUTSIDE);

    return null;
  }

  const entry = repo.entries.get(Number(arg));
  const verdict = access(entry, i.user.id);

  if (verdict === "ok") return entry;

  await tell(i, REFUSALS[verdict]);

  return null;
}
