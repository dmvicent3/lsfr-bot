import type {
  APIActionRowComponent,
  APIButtonComponentWithCustomId,
  MessageCreateOptions,
  MessageMentionOptions,
} from "discord.js";
import type { SendResult } from "../../core/types.ts";
import type { ReminderStore } from "./store/reminders.ts";

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

export interface DueDeps {
  store: ReminderStore;
  send: (channelId: string, m: MessageCreateOptions) => Promise<SendResult>;
  /** False when the member can't be reached. */
  dm: (userId: string, m: MessageCreateOptions) => Promise<boolean>;
  guildName: (guildId: string) => string;
  /** False once the role is deleted (it would show as "@deleted-role" and ping no one). */
  roleExists: (guildId: string, roleId: string) => boolean;
  now: () => number;
}

/** What /remind set was given, with the context to check it in. */
export interface NewRequest {
  guildId: string;
  channelId: string;
  authorId: string;
  when: string;
  what: string;
  /** Null: the author. */
  who: Target | null;
  /** The author could ping the `who` role themselves (it's mentionable, or they may ping any role). */
  rolePingable: boolean;
  now: number;
  pending: number;
}
