import type { MessageComponentInteraction } from "discord.js";
import { PERIODS, type Period } from "./types.ts";

export const toPeriod = (s: string | null | undefined): Period =>
  PERIODS.find((p) => p === s) ?? "today";

/** `<module>:page:<period>:<page>` args; anything unreadable is today's first page. */
export function pageArgs(args: string[]): { period: Period; page: number } {
  const page = Number(args[1]);

  return { period: toPeriod(args[0]), page: Number.isInteger(page) ? page : 1 };
}

/** What a page button asks for, as of now; null outside a server. */
export function pageRequest(i: MessageComponentInteraction, args: string[]) {
  if (!i.guildId) return null;

  return { ...pageArgs(args), guildId: i.guildId, viewerId: i.user.id, now: Date.now() };
}
