import { Events } from "discord.js";
import { log } from "../../../core/log.ts";
import type { EventHandler } from "../../../core/types.ts";
import { TriviaRepo } from "../store/repo.ts";

/** Sessions a restart cut off are ended; nothing resumes half-way. */
export const readyEvent: EventHandler = {
  event: Events.ClientReady,
  async handle(ctx) {
    const ended = new TriviaRepo(ctx.db).sessions.endAllLive(Date.now());

    if (ended > 0) log.info("trivia", `ended ${ended} session(s) left by a restart`);
  },
};
