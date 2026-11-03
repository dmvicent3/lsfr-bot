import { Routes } from "discord.js";
import type { Args, Outcome, ScriptDeps } from "../types.ts";

/** Ends each poll on Discord (votes finalise) and records it closed; an unknown id is skipped. */
export async function closePolls(ids: number[], d: ScriptDeps): Promise<Outcome> {
  const lines: string[] = [];

  for (const id of ids) {
    const poll = d.repo.polls.get(id);

    if (!poll) {
      lines.push(`No poll #${id}.`);
      continue;
    }

    await d.rest.post(Routes.expirePoll(poll.channelId, poll.messageId));
    d.repo.polls.close(id, d.now);
    lines.push(`closed poll #${id}`);
  }

  return { ok: lines.every((l) => l.startsWith("closed")), text: lines.join("\n") };
}

export const close = (args: Args["close"], d: ScriptDeps): Promise<Outcome> =>
  closePolls(args.ids, d);
