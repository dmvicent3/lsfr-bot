import { MessageFlags } from "discord.js";
import type { ComponentHandler } from "../../../core/types.ts";
import { memberName } from "../commands/name.ts";
import { runnerIn } from "../session/registry.ts";
import { pickReply } from "./replies.ts";

const LETTERS = ["A", "B", "C", "D"];

/** The letter `userId` holds in the open round, for "Locked in" and "already picked". */
function letterOf(roundPicks: { userId: string; index: number }[], userId: string): string | null {
  const index = roundPicks.find((p) => p.userId === userId)?.index;

  return index === undefined ? null : (LETTERS[index] ?? null);
}

/** `trivia:pick:<roundId>:<index>`: one locked-in pick per player. */
export const pickHandler: ComponentHandler = {
  id: "trivia:pick",
  async handle(i, args) {
    await i.deferReply({ flags: MessageFlags.Ephemeral });
    const runner = runnerIn(i.channelId);
    const [roundId = "", index = ""] = args;
    const pick = { userId: i.user.id, name: memberName(i), index: Number(index), at: Date.now() };
    const result = runner ? await runner.onPick(roundId, pick) : "closed";
    const round = runner?.state.round;
    const picks = round?.kind === "button" ? round.picks : [];
    await i.editReply(pickReply(result, letterOf(picks, i.user.id)));
  },
};
