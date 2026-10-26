import type {
  APIActionRowComponent,
  APIButtonComponentWithCustomId,
  MessageMentionOptions,
} from "discord.js";

/** Who gets pinged: a member, or everyone holding a role. */
export interface Target {
  kind: "user" | "role";
  id: string;
}

export interface Reminder {
  id: number;
  guildId: string;
  channelId: string;
  authorId: string;
  target: Target;
  text: string;
  dueAt: number;
  createdAt: number;
  /** Null until delivered, and again after a snooze. */
  sentAt: number | null;
  messageId: string | null;
}

/** A reminder before the store gives it an id. */
export type NewReminder = Omit<Reminder, "id" | "sentAt" | "messageId">;

/** Whoever pressed a reminder's button. */
export interface Clicker {
  id: string;
  roleIds: string[];
}

export interface NewCheck {
  at: number;
  now: number;
  text: string;
  /** The author's reminders in this server not yet sent. */
  pending: number;
}

export type ButtonRow = APIActionRowComponent<APIButtonComponentWithCustomId>;

export interface ListMessage {
  content: string;
  components: ButtonRow[];
}

/** The ping as sent: a MessageCreateOptions that allows only the target's mention. */
export interface DueMessage {
  content: string;
  components: ButtonRow[];
  allowedMentions: MessageMentionOptions;
}
