import { Events } from "discord.js";
import { log } from "../../../core/log.ts";
import type { EventHandler } from "../../../core/types.ts";
import { CardsRepo } from "../store/repo.ts";

/** Games a restart cut off are ended; nothing resumes half-way. */
export const readyEvent: EventHandler = {
  event: Events.ClientReady,
  async handle(ctx) {
    const ended = new CardsRepo(ctx.db).games.endAllLive(Date.now());

    if (ended > 0) log.info("cards", `ended ${ended} game(s) left by a restart`);
  },
};
