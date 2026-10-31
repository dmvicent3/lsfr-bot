import type { Jev } from "../../core/jev/types.ts";
import type { InlineImage } from "../../core/types.ts";
import type { selectImages } from "./images.ts";
import type { Message } from "discord.js";

/** A Discord attachment, before download. */
export interface ImageRef {
  url: string;
  size: number;
  contentType: string | null;
}

export type Picked = ReturnType<typeof selectImages>;

/** The mention being answered: the message, its reply chain, and Gork's own user id. */
export interface Mention {
  message: Message;
  chain: Message[];
  botId: string;
}

export interface ChainMessage {
  fromBot: boolean;
  author: string;
  text: string;
  images?: InlineImage[];
}

/** What chat needs: the local model, and SearXNG when web search is on. */
export interface ChatOptions {
  llmUrl: string;
  searchUrl: string | null;
  /** Decides when a message needs a web search; null means never search. */
  jev: Jev | null;
}
