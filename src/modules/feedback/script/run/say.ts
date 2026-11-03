import { Routes } from "discord.js";
import { asText, isRecord } from "../../../../core/guards.ts";
import { messageUrl, sayBody } from "../body.ts";
import { pollTarget } from "../target.ts";
import { closePolls } from "./close.ts";
import type { Args, Outcome, ScriptDeps } from "../types.ts";

/**
 * Posts a plain message (e.g. "this feedback is now live") in the server's feedback channel, then
 * ends the polls it answers.
 */
export async function say(args: Args["say"], d: ScriptDeps): Promise<Outcome> {
  const target = pollTarget(d.db, args.guildId);

  if (typeof target === "string") return { ok: false, text: target };

  const sent = await d.rest.post(Routes.channelMessages(target.channelId), {
    body: sayBody(args.text),
  });
  const messageId = isRecord(sent) ? asText(sent.id) : "";

  if (!messageId) return { ok: false, text: "Discord did not return the posted message." };

  const posted = `posted: ${messageUrl(target.guildId, target.channelId, messageId)}`;
  const closed = await closePolls(args.close, d);

  return { ok: closed.ok, text: [posted, ...(closed.text ? [closed.text] : [])].join("\n") };
}
