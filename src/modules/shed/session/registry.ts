import type { Runner } from "./runner.ts";

/** Live games by channel; module state, since a game lives no longer than the process. */
const runners = new Map<string, Runner>();

export const runnerIn = (channelId: string): Runner | undefined => runners.get(channelId);

export function register(channelId: string, runner: Runner): void {
  runners.set(channelId, runner);
}

/** Drops `runner` only if it is still the channel's live one; a newer game there stays. */
export function unregister(channelId: string, runner: Runner): void {
  if (runners.get(channelId) === runner) runners.delete(channelId);
}

/** Seated (and not dropped) in a live game in another channel of the same server. */
export function playingElsewhere(guildId: string, userId: string, channelId: string): boolean {
  for (const [id, r] of runners) {
    const g = r.state;

    if (id === channelId || r.ended || g.guildId !== guildId) continue;

    if (g.seats.some((s) => s.userId === userId && !s.dropped)) return true;
  }

  return false;
}
