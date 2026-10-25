import type { Jev } from "../../../core/jev/types.ts";
import type { RssRepo } from "../store/repo.ts";
import type { APIEmbed } from "discord.js";

export type PostResult = "ok" | "lost-channel" | "failed";

export interface CycleDeps {
  repo: RssRepo;
  jev: Jev;
  fetchFeed: (url: string) => Promise<string>;
  post: (channelId: string, embed: APIEmbed) => Promise<PostResult>;
  say: (channelId: string, text: string) => Promise<void>;
  now: () => number;
}

/** How jev did this cycle: answered, failed, or was not needed. */
export type JevOutcome = "ok" | "failed" | "unused";
