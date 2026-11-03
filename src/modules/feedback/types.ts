/** One feedback_entries row. */
export interface Entry {
  id: number;
  guildId: string;
  userId: string;
  topic: string;
  text: string;
  channelId: string | null;
  messageId: string | null;
  createdAt: number;
  editedAt: number | null;
  removedAt: number | null;
  readAt: number | null;
}

export interface NewEntry {
  guildId: string;
  userId: string;
  topic: string;
  text: string;
  now: number;
}

/** Which entries `list` shows: unread and not removed, or every one; optionally one topic. */
export interface EntryFilter {
  all: boolean;
  topic: string | null;
}

/** One feedback_polls row. */
export interface StoredPoll {
  id: number;
  guildId: string;
  channelId: string;
  messageId: string;
  question: string;
  options: string[];
  multi: boolean;
  createdAt: number;
  endsAt: number;
}

export type NewPoll = Omit<StoredPoll, "id">;

/** Whether a member may edit or remove an entry. */
export type Access = "ok" | "gone" | "not-author";
