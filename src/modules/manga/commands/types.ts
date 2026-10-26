import type { Database } from "bun:sqlite";
import type { ChatInputCommandInteraction } from "discord.js";
import type { MangaDexGet } from "../api/types.ts";
import type { MangaRepo } from "../store/repo.ts";

/** What every /manga subcommand gets: the interaction, the tables and the MangaDex client. */
export interface CommandCtx {
  i: ChatInputCommandInteraction;
  db: Database;
  repo: MangaRepo;
  get: MangaDexGet;
}

export type Handler = (c: CommandCtx) => Promise<void>;

export interface TitleRequest {
  sub: string;
  typed: string;
  userId: string;
}
