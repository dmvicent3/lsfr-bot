import { AttachmentBuilder } from "discord.js";
import type { Ctx } from "../../../core/types.ts";
import { fetchSeriesChannel, guildOf } from "./lookup.ts";
import { eventThread } from "./threads.ts";
import type { MotorsportRepo } from "../repo.ts";
import type { Post } from "../types.ts";

/** Sends into a followed series' channel or its weekend thread; unfollowed series are skipped. */
export function poster(ctx: Ctx, repo: MotorsportRepo): Post {
  return async (target, message) => {
    const f = repo.followed.get(target.series);

    if (!f) return;

    const channel = await fetchSeriesChannel(await guildOf(ctx), f);

    if (!channel) return;

    const destination =
      target.place === "thread" ? await eventThread(channel, repo, target) : channel;
    await destination.send({
      content: message.content,
      files: (message.files ?? []).map(
        (file) => new AttachmentBuilder(Buffer.from(file.data), { name: file.name }),
      ),
      allowedMentions: { parse: [] },
    });
  };
}
