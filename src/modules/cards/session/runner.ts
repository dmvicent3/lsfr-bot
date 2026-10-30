import { advance } from "../game/clock.ts";
import { join, leave, newGame, startGame } from "../game/lobby.ts";
import { playCard } from "../game/play.ts";
import type { Game } from "../game/types.ts";
import { castVote } from "../game/vote.ts";
import { type HandView, handMessage } from "../render/hand.ts";
import { current, finish, postPhase, show } from "./flow.ts";
import type { Click, Deps, Live, PlayClick, RunnerInit, Who } from "./types.ts";

/** One live game: ticks, clicks and stop run one at a time, in arrival order. */
export class Runner {
  private readonly live: Live;
  private queue: Promise<unknown> = Promise.resolve();

  constructor(
    init: RunnerInit,
    private readonly deps: Deps,
  ) {
    const game = newGame({ ...init, id: init.gameId, random: deps.random });
    this.live = { game, messageId: null, dirty: false, lost: false, ended: false };
  }

  get state(): Game {
    return this.live.game;
  }

  get ended(): boolean {
    return this.live.ended;
  }

  open(): Promise<void> {
    return this.run(() => postPhase(this.live, this.deps, current(this.live.game)));
  }

  tick(now: number): Promise<void> {
    return this.run(async () => {
      const change = advance(this.live.game, now, this.deps.random);

      if (change) return show(this.live, this.deps, change, now);

      if (this.live.dirty && this.live.messageId) {
        this.live.dirty = false;
        await this.deps.poster.edit(this.live.messageId, current(this.live.game));
      }
    });
  }

  onJoin(who: Who): Promise<ReturnType<typeof join>> {
    return this.run(async () => {
      const g = this.live.game;
      const out = this.live.ended ? "over" : join(g, who, this.deps.random);

      if (out === "joined" && g.phase !== "lobby") this.deps.repo.games.addPlayer(g.id, who.userId);

      this.live.dirty ||= out === "joined";

      return out;
    });
  }

  onLeave(userId: string): Promise<"left" | "not-in"> {
    return this.run(async () => {
      const out = leave(this.live.game, userId);
      this.live.dirty ||= out === "left";

      return out;
    });
  }

  onStart(userId: string, now: number): Promise<ReturnType<typeof startGame>> {
    return this.run(async () => {
      const g = this.live.game;
      const out = startGame(g, userId, now, this.deps.random);

      if (out !== "started") return out;

      for (const p of g.players) this.deps.repo.games.addPlayer(g.id, p.userId);

      await postPhase(this.live, this.deps, current(g));

      return out;
    });
  }

  onHand(userId: string): Promise<HandView> {
    return this.run(async () => handMessage(this.live.game, userId));
  }

  onPlay(c: PlayClick): Promise<{ result: ReturnType<typeof playCard>; hand: HandView }> {
    return this.run(async () => {
      const result = playCard(this.live.game, c);
      this.live.dirty ||= result === "played";

      return { result, hand: handMessage(this.live.game, c.userId) };
    });
  }

  onVote(c: Click): Promise<ReturnType<typeof castVote>> {
    return this.run(async () => {
      const out = castVote(this.live.game, c);
      this.live.dirty ||= out === "voted";

      return out;
    });
  }

  stop(now: number): Promise<void> {
    return this.run(async () => {
      this.live.game.phase = "over";
      this.live.game.endReason = "stop";
      await finish(this.live, this.deps, now);
    });
  }

  /** Queues `fn` behind earlier work, so no two steps interleave; a lost channel then ends the game. */
  private run<T>(fn: () => Promise<T>): Promise<T> {
    const next = this.queue.then(async () => {
      const out = await fn();

      if (this.live.lost) await finish(this.live, this.deps, Date.now());

      return out;
    });
    this.queue = next.catch(() => undefined);

    return next;
  }
}
