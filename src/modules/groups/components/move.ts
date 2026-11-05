import type { ComponentHandler } from "../../../core/types.ts";
import type { Landed, Turn } from "../play/types.ts";
import { load, turnOf } from "./guard.ts";
import { present, refresh } from "./show.ts";

/** A move on the round; `extra` are the custom ID parts after the scope and stamp. */
export type Move = (t: Turn, extra: string[]) => Landed;

/**
 * `groups:<action>:<date|practice>:<stamp>[:<arg>]`: plays `move` on the clicker's own round
 * and shows the result; a missing or earlier round gets the current board or the stale note.
 */
export const moveHandler = (action: string, move: Move): ComponentHandler => ({
  id: `groups:${action}`,
  async handle(i, args, ctx) {
    const r = load(i, ctx.db, args);

    if (!r || r.stale) return refresh(i, r);

    await present(i, r, move(turnOf(r), args.slice(2)));
  },
});
