import type { Database } from "bun:sqlite";
import type { InteractionReplyOptions, InteractionUpdateOptions } from "discord.js";
import { pageButtons } from "./page-buttons.ts";
import type { LeaderboardPage } from "./leaderboard-page.ts";
import type { DateRange, Period } from "./types.ts";
import { dateIn } from "./zoned.ts";

/** A page that fits both a slash reply and a button update. */
export type ViewOptions = Pick<
  InteractionReplyOptions & InteractionUpdateOptions,
  "content" | "components" | "allowedMentions"
>;

export interface PageAsk {
  guildId: string;
  period: Period;
  page: number;
  viewerId: string;
  now: number;
}

/** What differs between the games' leaderboards; the rest of the view is shared. */
export interface LeaderboardKit<R, G, S> {
  /** The page button ID prefix, e.g. "duel:page". */
  prefix: string;
  timeZone(db: Database, guildId: string): string;
  periodRange(period: Period, today: string): DateRange;
  /** The games that count towards the standings in the range. */
  games(repo: R, guildId: string, range: DateRange): G[];
  standings(games: G[]): S[];
  render(v: { range: DateRange; list: S[]; page: number; viewerId: string }): LeaderboardPage;
}

/** A leaderboard page as of `now`; the slash command and the page buttons both send this. */
export const leaderboardView =
  <R, G, S>(kit: LeaderboardKit<R, G, S>) =>
  (db: Database, repo: R, v: PageAsk): ViewOptions => {
    const today = dateIn(v.now, kit.timeZone(db, v.guildId));
    const range = kit.periodRange(v.period, today);
    const list = kit.standings(kit.games(repo, v.guildId, range));
    const page = kit.render({ range, list, page: v.page, viewerId: v.viewerId });

    return {
      content: page.content,
      components: pageButtons(kit.prefix, v.period, page.page, page.pages),
      allowedMentions: { parse: [] as [] },
    };
  };
