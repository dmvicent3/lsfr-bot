import type { MessageCreateOptions } from "discord.js";
import type { Rest } from "../../../core/polls/types.ts";
import type { SendResult } from "../../../core/types.ts";
import type { GachaRepo } from "../store/repo.ts";
import type { Roster } from "../types.ts";

/** What the weekly banner work needs: the tables, the drivers, Discord, the clock and dice. */
export interface WeeklyDeps {
  repo: GachaRepo;
  roster: Roster;
  /** Discord REST, for posting and reading polls. */
  rest: Rest;
  send(channelId: string, message: MessageCreateOptions): Promise<SendResult>;
  now: number;
  random: () => number;
}
