import { MessageFlags } from "discord.js";
import { log } from "../../../core/log.ts";
import type { ComponentHandler, Ctx } from "../../../core/types.ts";
import { fetchSeriesChannel, guildOf } from "../channels/lookup.ts";
import { updatePinned } from "../channels/pinned.ts";
import { predictPicker, savePick } from "../predictions/predict-actions.ts";
import { MotorsportRepo } from "../repo.ts";
import { toSeriesKey } from "../series.ts";
import type { SeriesKey } from "../types.ts";

const asReply = (picker: Awaited<ReturnType<typeof predictPicker>>) =>
  typeof picker === "string" ? { content: picker, components: [] } : picker;

/** "Predict" on the pinned schedule, or a picker's button to switch to another session. */
const predictMenu: ComponentHandler = {
  id: "motorsport:predictmenu",
  async handle(i, args, ctx) {
    const series = toSeriesKey(args[0] ?? "");
    const sessionId = args[2];
    // The live driver list may need fetching: acknowledge first.
    await (sessionId === undefined
      ? i.deferReply({ flags: MessageFlags.Ephemeral })
      : i.deferUpdate());
    const repo = new MotorsportRepo(ctx.db);
    const picker = await predictPicker(
      repo,
      { userId: i.user.id, now: Date.now() },
      { series, eventId: args[1] ?? "", sessionId },
      fetch,
    );
    await i.editReply(asReply(picker));
  },
};

/** Re-renders the pinned schedule so its prediction count is current. Best effort. */
async function refreshPinned(ctx: Ctx, repo: MotorsportRepo, series: SeriesKey): Promise<void> {
  try {
    const f = repo.followed.get(series);

    if (!f) return;

    const channel = await fetchSeriesChannel(await guildOf(ctx), f);

    if (channel) await updatePinned(channel, repo, f, Date.now());
  } catch (err) {
    log.error("motorsport:predict", `${series} pinned refresh failed`, err);
  }
}

/** One of the picker's P1/P2/P3 selects: saves that position and re-renders the picker. */
const predict: ComponentHandler = {
  id: "motorsport:predict",
  async handle(i, args, ctx) {
    if (!i.isStringSelectMenu()) return;

    const series = toSeriesKey(args[0] ?? "");
    const [, eventId = "", sessionId = "", index = ""] = args;
    const repo = new MotorsportRepo(ctx.db);
    const viewer = { userId: i.user.id, now: Date.now() };
    const outcome = savePick(
      repo,
      viewer,
      { series, eventId, sessionId },
      { index: Number(index), driverId: i.values[0] ?? "" },
    );

    if (!outcome.ok) {
      await i.update({ content: outcome.text, components: [] });

      return;
    }

    await i.deferUpdate();
    await i.editReply(
      asReply(await predictPicker(repo, viewer, { series, eventId, sessionId }, fetch)),
    );

    if (outcome.completed) await refreshPinned(ctx, repo, series);
  },
};

export const predictionComponents: ComponentHandler[] = [predictMenu, predict];
