import type { ComponentHandler } from "../../../core/types.ts";
import { pageArgs } from "../../trivia/components/page.ts";
import { leaderboardView } from "../commands/boards.ts";
import { FourRepo } from "../store/repo.ts";

/** `four:page:<period>:<page>`: re-renders the leaderboard in place as of now. */
export const pageHandler: ComponentHandler = {
  id: "four:page",
  async handle(i, args, ctx) {
    if (!i.guildId) return;

    const view = { ...pageArgs(args), guildId: i.guildId, viewerId: i.user.id, now: Date.now() };
    await i.update(leaderboardView(new FourRepo(ctx.db), view));
  },
};
