import type { ComponentHandler } from "../../../core/types.ts";
import { openPractice } from "../play/open.ts";
import { view } from "../render/view.ts";
import { SudokuRepo } from "../store/repo.ts";
import { STALE, tell } from "./guard.ts";
import { parseKey } from "./key.ts";

/** `sudoku:new:practice`: a fresh board at the same level, replacing this one. */
export const newHandler = (random: () => number): ComponentHandler => ({
  id: "sudoku:new",
  async handle(i, args, ctx) {
    const now = Date.now();
    const key = i.guildId ? parseKey(args, i.user.id, i.guildId) : null;
    const repo = new SudokuRepo(ctx.db);
    const current = key?.kind === "practice" ? repo.games.get(key) : null;

    if (!key || !current) return tell(i, STALE);

    const { guildId, userId } = key;

    /** Generating can outlast Discord's 3 s for a first answer, so acknowledge the click first. */
    await i.deferUpdate();
    const fresh = openPractice(repo, { guildId, userId, level: current.level, now, random });
    await i.editReply(view(fresh, now));
  },
});
