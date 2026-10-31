import { newGame } from "../game/new.ts";
import type { Act, Game } from "../game/types.ts";
import { type HandView, handView } from "../render/hand.ts";
import { finish } from "./flow.ts";
import type { Deps, Live, RunnerInit, TurnClick } from "./types.ts";

/** Results that change what the board shows. */
const CHANGED = new Set([
  "joined",
  "left",
  "on",
  "off",
  "played",
  "pick-colour",
  "can-play",
  "passed",
  "took",
  "picked",
  "caught",
]);

export type Turn<R> = Promise<{ result: R; hand: HandView }>;

/** A live game's queue: every step runs alone, in arrival order, and a game over ends it. */
export class Session {
  protected readonly live: Live;
  private queue: Promise<unknown> = Promise.resolve();

  constructor(
    init: RunnerInit,
    protected readonly deps: Deps,
  ) {
    const game = newGame({ ...init, id: init.gameId });
    this.live = { game, messageId: null, dirty: false, lost: false, ended: false };
  }

  get state(): Game {
    return this.live.game;
  }

  get ended(): boolean {
    return this.live.ended;
  }

  /** A click on the game: the board is marked for the next tick when it changed something. */
  protected change<R extends string>(now: number, fn: (g: Game) => R): Promise<R> {
    return this.run(now, async () => {
      const out = fn(this.live.game);
      this.live.dirty ||= CHANGED.has(out);

      return out;
    });
  }

  /** A turn click, with the clicker's refreshed hand. */
  protected turn<C extends TurnClick, R extends string>(
    c: C,
    fn: (g: Game, a: C & Act) => R,
  ): Turn<R> {
    return this.run(c.now, async () => {
      const result = fn(this.live.game, { ...c, random: this.deps.random });
      this.live.dirty ||= CHANGED.has(result);

      return { result, hand: handView(this.live.game, c.userId, 1) };
    });
  }

  /** Queues `fn` behind earlier work; a lost channel or a game over then ends the game. */
  protected run<T>(now: number, fn: () => Promise<T>): Promise<T> {
    const next = this.queue.then(async () => {
      const out = await fn();

      if (this.live.lost || this.live.game.phase === "over")
        await finish(this.live, this.deps, now);

      return out;
    });
    this.queue = next.catch(() => undefined);

    return next;
  }
}
