import type { FeedItem } from "../feeds/types.ts";
import type { RuleKind } from "../rules/types.ts";

export interface Feed {
  id: number;
  guildId: string;
  url: string;
  name: string;
  failures: number;
  warned: boolean;
}

export interface FeedRow {
  id: number;
  guild_id: string;
  url: string;
  name: string;
  failures: number;
  warned: number;
}

/** `duplicate`: passed the rules but repeats a story already posted. */
export type ItemState = "pending" | "passed" | "posted" | "blocked" | "expired" | "duplicate";

export interface StoredItem extends FeedItem {
  id: number;
  feedId: number;
  state: ItemState;
  createdAt: number;
}

export interface NewItem {
  guildId: string;
  feedId: number;
  key: string;
  item: FeedItem;
  state: ItemState;
  now: number;
}

export interface ItemRow {
  id: number;
  feed_id: number;
  title: string;
  link: string | null;
  guid: string | null;
  description: string;
  image: string | null;
  published_at: number | null;
  state: ItemState;
  created_at: number;
}

export interface RuleRow {
  id: number;
  text: string;
  kind: RuleKind;
  feed_ids: string | null;
}

export interface Server {
  guildId: string;
  channelId: string;
  jevDown: boolean;
}

export interface ServerRow {
  guild_id: string;
  channel_id: string | null;
  jev_down: number;
}
