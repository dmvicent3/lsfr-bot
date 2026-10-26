import type { APIEmbed } from "discord.js";
import type { SendResult } from "../../../core/types.ts";
import type { Chapter, MangaDexGet } from "../api/types.ts";
import type { MangaRepo } from "../store/repo.ts";

export interface PollDeps {
  repo: MangaRepo;
  get: MangaDexGet;
  /** Sends to the manga channel. */
  send: (m: PostMessage) => Promise<SendResult>;
  now: () => number;
}

/** "send-failed" ends the run: the channel is gone or Discord refused, so later posts would be too. */
export type CheckResult = "ok" | "fetch-failed" | "send-failed";

/** A message of a chapter post; only the users it names can be pinged. */
export interface PostMessage {
  content: string;
  allowedMentions: { users: string[] };
  embeds?: APIEmbed[];
}

/** What a series has already posted: the highest chapter number, and oneshot ids. */
export interface Seen {
  highest: number | null;
  unnumbered: Set<string>;
}

/** One message's chapters, and what to store once it is sent. */
export interface Post {
  /** Ascending; more than one only when a bulk upload was collapsed. */
  chapters: Chapter[];
  highest: number | null;
  unnumberedId: string | null;
}
