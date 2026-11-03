import { Routes } from "discord.js";
import { asText, isRecord } from "../../../../core/guards.ts";
import { messageUrl, pollBody, pollEnd } from "../body.ts";
import { pollTarget } from "../target.ts";
import type { Args, Outcome, ScriptDeps } from "../types.ts";

/** Posts a native poll in the server's poll channel and stores it. */
export async function poll(args: Args["poll"], d: ScriptDeps): Promise<Outcome> {
  const target = pollTarget(d.db, args.guildId);

  if (typeof target === "string") return { ok: false, text: target };

  const sent = await d.rest.post(Routes.channelMessages(target.channelId), {
    body: pollBody(args.poll),
  });
  const messageId = isRecord(sent) ? asText(sent.id) : "";

  if (!messageId) return { ok: false, text: "Discord did not return the posted message." };

  const { question, options, multi, hours } = args.poll;
  const id = d.repo.polls.add({
    ...target,
    messageId,
    question,
    options,
    multi,
    createdAt: d.now,
    endsAt: pollEnd(sent, d.now, hours),
  });
  const url = messageUrl(target.guildId, target.channelId, messageId);

  return { ok: true, text: `poll #${id} posted: ${url}` };
}
