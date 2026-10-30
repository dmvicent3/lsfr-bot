import { IDLE_LIMIT } from "../idle.ts";
import type { Answer, Pick } from "../rounds/types.ts";
import { endSession } from "./end.ts";
import { answer, chooseTopic, type Named, type PickOutcome, pick } from "./inputs.ts";
import { step } from "./step.ts";
import type { Deps, SessionState } from "./types.ts";

const initial = (s: {
  sessionId: number;
  guildId: string;
  channelId: string;
  now: number;
}): SessionState => ({
  sessionId: s.sessionId,
  guildId: s.guildId,
  channelId: s.channelId,
  round: null,
  messageId: null,
  topicBy: null,
  topic: null,
  perk: null,
  rounds: 0,
  idle: 0,
  nextAt: s.now,
  names: new Map(),
  dirty: false,
  lastPlayers: [],
  image: null,
  active: new Set(),
  points: new Map(),
  lost: false,
  ended: false,
});

/** One live session: ticks, messages, clicks and stop run one at a time, in arrival order. */
export class Runner {
  readonly state: SessionState;
  private queue: Promise<unknown> = Promise.resolve();

  constructor(
    init: { sessionId: number; guildId: string; channelId: string; now: number },
    private readonly deps: Deps,
  ) {
    this.state = initial(init);
  }

  get ended(): boolean {
    return this.state.ended;
  }

  async tick(now: number): Promise<void> {
    await this.run(now, () => step(this.state, this.deps, now));
  }

  async onMessage(m: Named<Answer>): Promise<void> {
    await this.run(m.at, () => answer(this.state, this.deps, m));
  }

  async onPick(roundId: string, p: Named<Pick>): Promise<PickOutcome> {
    const picked = () => pick(this.state, this.deps, roundId, p);

    return (await this.run(p.at, picked)) ?? { result: "closed", index: null };
  }

  async onTopic(
    userId: string,
    topic: string,
    at = Date.now(),
  ): Promise<"ok" | "not-yours" | "over"> {
    const chosen = () => chooseTopic(this.state, this.deps, { userId, topic, at });

    return (await this.run(at, chosen)) ?? "over";
  }

  async stop(now: number): Promise<void> {
    await this.run(now, () => endSession(this.state, this.deps, "stop", now));
  }

  /** Queues `fn` behind earlier work; after it, a lost channel or idle streak ends the session. */
  private run<T>(now: number, fn: () => Promise<T>): Promise<T | undefined> {
    const next = this.queue.then(async () => {
      if (this.state.ended) return undefined;

      const result = await fn();
      await this.settle(now);

      return result;
    });
    this.queue = next.catch(() => undefined);

    return next;
  }

  private async settle(now: number): Promise<void> {
    if (this.state.lost) return endSession(this.state, this.deps, "lost", now);

    if (this.state.idle >= IDLE_LIMIT) return endSession(this.state, this.deps, "idle", now);
  }
}
