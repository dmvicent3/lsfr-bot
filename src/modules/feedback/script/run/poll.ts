import { postPoll } from "../../../../core/polls/post.ts";
import { messageUrl } from "../body.ts";
import { pollTarget } from "../target.ts";
import type { Args, Outcome, ScriptDeps } from "../types.ts";

/** Posts a native poll in the server's poll channel and stores it. */
export async function poll(args: Args["poll"], d: ScriptDeps): Promise<Outcome> {
  const target = pollTarget(d.db, args.guildId);

  if (typeof target === "string") return { ok: false, text: target };

  const posted = await postPoll(d.rest, target.channelId, args.poll, d.now);

  if (!posted) return { ok: false, text: "Discord did not return the posted message." };

  const { question, options, multi } = args.poll;
  const id = d.repo.polls.add({
    ...target,
    ...posted,
    question,
    options,
    multi,
    createdAt: d.now,
  });
  const url = messageUrl(target.guildId, target.channelId, posted.messageId);

  return { ok: true, text: `poll #${id} posted: ${url}` };
}
