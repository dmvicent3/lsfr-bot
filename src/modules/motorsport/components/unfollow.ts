import type { ComponentHandler } from "../../../core/types.ts";
import { guildOf } from "../channels/lookup.ts";
import { deleteSeriesChannel } from "../channels/setup.ts";
import { notFollowedText } from "../pings/actions.ts";
import { MotorsportRepo } from "../repo.ts";
import { seriesInfo, toSeriesKey } from "../series.ts";

/** The confirm button under `/motorsport unfollow`. */
export const unfollow: ComponentHandler = {
  id: "motorsport:unfollow",
  async handle(i, args, ctx) {
    const series = toSeriesKey(args[0] ?? "");
    const repo = new MotorsportRepo(ctx.db);
    const followed = repo.followed.get(series);
    if (!followed) {
      await i.update({ content: notFollowedText(series), components: [] });
      return;
    }
    await i.deferUpdate();
    const guild = await guildOf(ctx);
    await deleteSeriesChannel(guild, followed);
    repo.deleteSeries(series);
    await i.editReply({ content: `Unfollowed ${seriesInfo(series).name}.`, components: [] });
  },
};
