import type { ComponentHandler } from "../../../core/types.ts";
import { saveChip } from "../predictions/chip-actions.ts";
import { predictPicker } from "../predictions/picker-actions.ts";
import { MotorsportRepo } from "../repo.ts";
import { toSeriesKey } from "../series.ts";
import { asReply } from "./picker-reply.ts";

/** The F1 picker's chip select: plays or clears the weekend's chip, then re-renders the picker. */
export const chip: ComponentHandler = {
  id: "motorsport:chip",
  async handle(i, args, ctx) {
    if (!i.isStringSelectMenu()) return;

    const series = toSeriesKey(args[0] ?? "");
    const [, eventId = "", sessionId = ""] = args;
    const repo = new MotorsportRepo(ctx.db);
    const viewer = { userId: i.user.id, now: Date.now() };
    const refusal = saveChip(repo, viewer, { series, eventId }, i.values[0] ?? "");
    // The live driver list may need fetching: acknowledge first.
    await i.deferUpdate();
    const picker = await predictPicker(repo, viewer, { series, eventId, sessionId }, fetch);
    await i.editReply(asReply(picker, refusal));
  },
};
