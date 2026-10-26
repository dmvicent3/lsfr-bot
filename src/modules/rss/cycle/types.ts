import type { Embedder } from "../../../core/embed/types.ts";
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
  /** Null skips the repeat check. */
  embedder: Embedder | null;
}

/** How jev did this cycle: answered, failed, or was not needed. */
export type JevOutcome = "ok" | "failed" | "unused";

/** What the repeat check found: a repeat, or the vector to store (null: not checked). */
export type Check = "repeat" | Float32Array | null;

/** One postPassed call: its server, deps, and whether an embed failure was logged yet. */
export interface Pass {
  guildId: string;
  d: CycleDeps;
  logged: boolean;
}
