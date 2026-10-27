import type { Jev, JevOptions, YesNoOptions } from "./types.ts";
import type { FetchFn } from "../types.ts";
import { JevError, postYesNo } from "./http.ts";
import type { JevQuestion } from "./types.ts";

const MAX_STATE = 1_500;
const MIN_GAP_MS = 1_000;
/** Pause after the 1st, 2nd, … consecutive failure; the last value repeats. */
const BACKOFF_MS = [60_000, 120_000, 240_000, 480_000, 900_000];

/**
 * The one door to jev, so the Pi is never flooded: calls queue and run one at a time, at most one
 * a second; after a failure, calls fail fast (no request) for a back-off that grows to 15 minutes.
 */
export class JevQueue implements Jev {
  private tail: Promise<unknown> = Promise.resolve();
  private lastStart = -Infinity;
  private failures = 0;
  private pausedUntil = 0;
  private readonly fetchFn: FetchFn;
  private readonly now: () => number;
  private readonly sleep: (ms: number) => Promise<void>;

  constructor(private readonly opts: JevOptions) {
    this.fetchFn = opts.fetchFn ?? fetch;
    this.now = opts.now ?? Date.now;
    this.sleep = opts.sleep ?? ((ms) => Bun.sleep(ms));
  }

  yesNo(
    state: string,
    questions: JevQuestion[],
    opts?: YesNoOptions,
  ): Promise<Map<string, number>> {
    const cut = state.slice(0, opts?.maxState ?? MAX_STATE);
    const result = this.tail.catch(() => undefined).then(() => this.run(cut, questions));
    this.tail = result;

    return result;
  }

  private async run(state: string, questions: JevQuestion[]): Promise<Map<string, number>> {
    if (this.now() < this.pausedUntil) throw new JevError("jev is paused after a failure");

    await this.spaceOut();

    try {
      const answers = await postYesNo(this.opts.url, state, questions, this.fetchFn);
      this.failures = 0;
      this.pausedUntil = 0;

      return answers;
    } catch (err) {
      this.failures++;
      const pause = BACKOFF_MS[Math.min(this.failures, BACKOFF_MS.length) - 1] ?? 0;
      this.pausedUntil = this.now() + pause;
      throw err;
    }
  }

  /** Keeps calls at least MIN_GAP_MS apart. */
  private async spaceOut(): Promise<void> {
    const wait = this.lastStart + MIN_GAP_MS - this.now();

    if (wait > 0) await this.sleep(wait);

    this.lastStart = this.now();
  }
}

export const createJev = (opts: JevOptions): Jev => new JevQueue(opts);
