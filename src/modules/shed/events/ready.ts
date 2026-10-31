import { Events } from "discord.js";
import { log } from "../../../core/log.ts";
import type { EventHandler } from "../../../core/types.ts";
import { discordPoster } from "../../trivia/session/poster.ts";
import { TITLE } from "../render/parts.ts";
import { ShedRepo } from "../store/repo.ts";

const ENDED = {
  embeds: [{ title: TITLE, description: "Game ended (bot restarted)." }],
  components: [],
};

/** Games a restart cut off are ended and their boards tidied; nothing resumes half-way. */
export const readyEvent: EventHandler = {
  event: Events.ClientReady,
  async handle(ctx) {
    const ended = new ShedRepo(ctx.db).games.endAllLive(Date.now());

    for (const g of ended)
      if (g.messageId) await discordPoster(ctx.client, g.channelId).edit(g.messageId, ENDED);

    if (ended.length > 0) log.info("shed", `ended ${ended.length} game(s) left by a restart`);
  },
};
