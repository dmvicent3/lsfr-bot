import type { Database } from "bun:sqlite";
import { pageRequest } from "./page-args.ts";
import type { PageAsk, ViewOptions } from "./leaderboard-view.ts";
import type { ComponentHandler } from "./types.ts";

/** Re-renders in place as of now, so a page from last week shows this week. */
export const pageHandler = <R>(
  id: string,
  makeRepo: (db: Database) => R,
  view: (db: Database, repo: R, v: PageAsk) => ViewOptions,
): ComponentHandler => ({
  id,
  async handle(i, args, ctx) {
    const ask = pageRequest(i, args);

    if (ask) await i.update(view(ctx.db, makeRepo(ctx.db), ask));
  },
});
