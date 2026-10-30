import type { Runner } from "./runner.ts";

/** Live sessions by channel; module state, since a session lives no longer than the process. */
const runners = new Map<string, Runner>();

export const runnerIn = (channelId: string): Runner | undefined => runners.get(channelId);

export function register(channelId: string, runner: Runner): void {
  runners.set(channelId, runner);
}

export function unregister(channelId: string): void {
  runners.delete(channelId);
}
