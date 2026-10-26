import type { ReminderRow } from "./types.ts";
import type { Database } from "bun:sqlite";
import type { NewReminder, Reminder } from "../types.ts";

const toReminder = (r: ReminderRow): Reminder => ({
  id: r.id,
  guildId: r.guild_id,
  channelId: r.channel_id,
  authorId: r.author_id,
  target: { kind: r.target_kind, id: r.target_id },
  text: r.text,
  dueAt: r.due_at,
  createdAt: r.created_at,
  sentAt: r.sent_at,
  messageId: r.message_id,
});

const SELECT = "SELECT * FROM reminders_reminders";

/** reminders_reminders: every reminder, pending or sent (sent ones are pruned after a while). */
export class ReminderStore {
  constructor(private readonly db: Database) {}

  add(r: NewReminder): Reminder {
    const row = this.db
      .query<ReminderRow, [string, string, string, string, string, string, number, number]>(
        `INSERT INTO reminders_reminders
           (guild_id, channel_id, author_id, target_id, target_kind, text, due_at, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING *`,
      )
      .get(
        r.guildId,
        r.channelId,
        r.authorId,
        r.target.id,
        r.target.kind,
        r.text,
        r.dueAt,
        r.createdAt,
      );

    if (!row) throw new Error("reminder insert returned nothing");

    return toReminder(row);
  }

  get(id: number): Reminder | null {
    const row = this.db.query<ReminderRow, [number]>(`${SELECT} WHERE id = ?`).get(id);

    return row ? toReminder(row) : null;
  }

  pendingByAuthor(guildId: string, authorId: string): Reminder[] {
    return this.db
      .query<ReminderRow, [string, string]>(
        `${SELECT} WHERE guild_id = ? AND author_id = ? AND sent_at IS NULL ORDER BY due_at, id`,
      )
      .all(guildId, authorId)
      .map(toReminder);
  }

  /** Unsent reminders due by `now`, oldest first. */
  due(now: number): Reminder[] {
    return this.db
      .query<ReminderRow, [number]>(
        `${SELECT} WHERE sent_at IS NULL AND due_at <= ? ORDER BY due_at, id`,
      )
      .all(now)
      .map(toReminder);
  }

  markSent(id: number, sentAt: number, messageId: string | null): void {
    this.db.run("UPDATE reminders_reminders SET sent_at = ?, message_id = ? WHERE id = ?", [
      sentAt,
      messageId,
      id,
    ]);
  }

  /** Pending again, due at `dueAt`. */
  snooze(id: number, dueAt: number): void {
    this.db.run(
      "UPDATE reminders_reminders SET due_at = ?, sent_at = NULL, message_id = NULL WHERE id = ?",
      [dueAt, id],
    );
  }

  remove(id: number): boolean {
    return this.db.run("DELETE FROM reminders_reminders WHERE id = ?", [id]).changes > 0;
  }

  /** Deletes reminders sent before `before`; returns how many. */
  prune(before: number): number {
    return this.db.run("DELETE FROM reminders_reminders WHERE sent_at < ?", [before]).changes;
  }
}
