import { reply } from "../../../core/replies.ts";
import { runnerIn } from "../session/registry.ts";
import { memberName } from "./name.ts";
import type { CommandCtx } from "./types.ts";

export async function stop({ i }: CommandCtx): Promise<void> {
  const runner = runnerIn(i.channelId);

  if (!runner) return reply(i, "No trivia running here.");

  const name = memberName(i);
  await i.reply({ content: `Trivia stopped by **${name}**`, allowedMentions: { parse: [] } });
  await runner.stop(Date.now());
}
