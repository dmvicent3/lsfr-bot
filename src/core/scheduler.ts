import { log } from "./log.ts";
import type { Ctx, Job } from "./module.ts";

export async function safely(scope: string, fn: () => Promise<void>): Promise<void> {
  try {
    await fn();
  } catch (err) {
    log.error(scope, "failed", err);
  }
}

/** Wraps fn so a call made while the previous call is still running is skipped. */
export function nonOverlapping(fn: () => Promise<void>): () => Promise<void> {
  let running = false;
  return async () => {
    if (running) return;
    running = true;
    try {
      await fn();
    } finally {
      running = false;
    }
  };
}

export function startJobs(entries: { module: string; job: Job }[], ctx: Ctx): void {
  for (const { module, job } of entries) {
    const scope = `${module}:${job.name}`;
    const run = nonOverlapping(() => safely(scope, () => job.run(ctx)));
    Bun.cron(job.cron, run);
    if (job.runOnStart) void run();
    log.info(scope, `scheduled (${job.cron})`);
  }
}

/**
 * A per-key mutex: calls sharing a key run one after another, other keys run freely. A
 * call that throws still releases the key.
 */
export function keyedLock(): <T>(key: string, fn: () => Promise<T>) => Promise<T> {
  const tails = new Map<string, Promise<unknown>>();
  return async (key, fn) => {
    const previous = tails.get(key) ?? Promise.resolve();
    const run = previous.catch(() => undefined).then(fn);
    tails.set(key, run);
    try {
      return await run;
    } finally {
      if (tails.get(key) === run) tails.delete(key);
    }
  };
}
