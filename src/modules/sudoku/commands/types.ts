import type { Database } from "bun:sqlite";
import type { ChatInputCommandInteraction } from "discord.js";
import type { SudokuRepo } from "../store/repo.ts";

/** What every /sudoku subcommand gets: the interaction (in a server), the tables and randomness. */
export interface CommandCtx {
  i: ChatInputCommandInteraction;
  guildId: string;
  db: Database;
  repo: SudokuRepo;
  random: () => number;
}

export type Handler = (c: CommandCtx) => Promise<void>;
