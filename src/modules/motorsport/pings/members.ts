import type { MemberSource } from "./types.ts";

/**
 * Loads a guild's full member list once per process. With the GuildMembers intent the
 * cache then stays current through member events, so role.members is accurate without
 * re-fetching (a gateway request) on every ping. Concurrent callers share one fetch; a
 * failed fetch is forgotten so the next call retries.
 */
export function memberLoader(): (guild: MemberSource) => Promise<void> {
  const loads = new Map<string, Promise<void>>();

  return (guild) => {
    let load = loads.get(guild.id);

    if (!load) {
      load = guild.members.fetch().then(() => undefined);
      loads.set(guild.id, load);
      load.catch(() => loads.delete(guild.id));
    }

    return load;
  };
}
