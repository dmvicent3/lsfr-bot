import type { RssRepo } from "../store/repo.ts";
import type { ChatInputCommandInteraction } from "discord.js";

/** What every /rss subcommand gets: the interaction, the server and its rss tables. */
export interface CommandCtx {
  i: ChatInputCommandInteraction;
  guildId: string;
  repo: RssRepo;
}

export type Handler = (c: CommandCtx) => Promise<void>;
