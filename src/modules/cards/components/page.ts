import type { ComponentHandler } from "../../../core/types.ts";
import { pageArgs } from "../../trivia/components/page.ts";
import { leaderboardView } from "../commands/boards.ts";
import { CardsRepo } from "../store/repo.ts";

/** `cards:page:<period>:<page>`: re-renders the leaderboard in place as of now. */
export const pageHandler: ComponentHandler = {
  id: "cards:page",
  async handle(i, args, ctx) {
    if (!i.guildId) return;

    const view = { ...pageArgs(args), guildId: i.guildId, viewerId: i.user.id, now: Date.now() };
    await i.update(leaderboardView(new CardsRepo(ctx.db), view));
  },
};
