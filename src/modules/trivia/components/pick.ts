import { MessageFlags } from "discord.js";
import type { ComponentHandler } from "../../../core/types.ts";
import { memberName } from "../commands/name.ts";
import { runnerIn } from "../session/registry.ts";
import { pickReply } from "./replies.ts";

const LETTERS = ["A", "B", "C", "D"];

/** `trivia:pick:<roundId>:<index>`: one locked-in pick per player. */
export const pickHandler: ComponentHandler = {
  id: "trivia:pick",
  async handle(i, args) {
    await i.deferReply({ flags: MessageFlags.Ephemeral });
    const runner = runnerIn(i.channelId);
    const [roundId = "", index = ""] = args;
    const pick = { userId: i.user.id, name: memberName(i), index: Number(index), at: Date.now() };
    const out = runner
      ? await runner.onPick(roundId, pick)
      : { result: "closed" as const, index: null };
    const letter = out.index === null ? null : (LETTERS[out.index] ?? null);
    await i.editReply(pickReply(out.result, letter));
  },
};
