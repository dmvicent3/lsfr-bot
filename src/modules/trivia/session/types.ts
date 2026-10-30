import type { MessageCreateOptions } from "discord.js";
import type { SendResult } from "../../../core/types.ts";
import type { Round } from "../rounds/types.ts";
import type { TriviaRepo } from "../store/repo.ts";
import type { KaosList, Picture, Question } from "../types.ts";
import type { PictureFile } from "./image.ts";

export type Outgoing = Pick<MessageCreateOptions, "content" | "embeds" | "components" | "files">;

/** Sends to and edits in the session's channel. */
export interface Poster {
  post(msg: Outgoing): Promise<SendResult>;
  edit(messageId: string, msg: Outgoing): Promise<boolean>;
}

export interface Deps {
  repo: TriviaRepo;
  poster: Poster;
  random: () => number;
  questions: readonly Question[];
  lists: readonly KaosList[];
  pictures: readonly Picture[];
  /** A picture's image, or null when it cannot be had (the round is then a text question). */
  fetchImage: (file: string) => Promise<PictureFile | null>;
  /** The clock, read again once a picture has downloaded so the round starts when it is posted. */
  now: () => number;
  /** Called once when the session ends, to drop its timer and registry entry. */
  onEnd: () => void;
}

/** The sole survivor's pending topic choice. */
export interface Perk {
  userId: string;
  until: number;
  messageId: string;
  topics: string[];
}

export type EndReason = "stop" | "idle" | "lost";

/** Everything a live session remembers between ticks. */
export interface SessionState {
  sessionId: number;
  guildId: string;
  channelId: string;
  round: Round | null;
  messageId: string | null;
  /** The open round's attached image name, kept in the embed on every edit. */
  image: string | null;
  /** Who chose the open round's topic. */
  topicBy: string | null;
  /** The topic the next round must come from, and who chose it. */
  topic: { name: string; by: string } | null;
  perk: Perk | null;
  rounds: number;
  idle: number;
  nextAt: number;
  names: Map<string, string>;
  /** Claims since the KAOS embed was last edited. */
  dirty: boolean;
  lastPlayers: string[];
  /** Everyone who posted or clicked during the open round, right or wrong. */
  active: Set<string>;
  points: Map<string, number>;
  /** Set when a send fails; the runner then ends the session silently. */
  lost: boolean;
  ended: boolean;
}
