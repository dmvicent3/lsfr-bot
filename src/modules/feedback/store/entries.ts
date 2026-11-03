import type { Database } from "bun:sqlite";
import type { Entry, EntryFilter, NewEntry } from "../types.ts";

const COLUMNS = `id, guild_id AS guildId, user_id AS userId, topic, text,
  channel_id AS channelId, message_id AS messageId, created_at AS createdAt,
  edited_at AS editedAt, removed_at AS removedAt, read_at AS readAt`;

/** feedback_entries: what members said, and where it was posted. */
export class EntryStore {
  constructor(private readonly db: Database) {}

  /** The new entry's id. */
  add(e: NewEntry): number {
    return Number(
      this.db.run(
        "INSERT INTO feedback_entries (guild_id, user_id, topic, text, created_at) VALUES (?, ?, ?, ?, ?)",
        [e.guildId, e.userId, e.topic, e.text, e.now],
      ).lastInsertRowid,
    );
  }

  /** Records the public message that shows the entry. */
  attach(id: number, channelId: string, messageId: string): void {
    this.db.run("UPDATE feedback_entries SET channel_id = ?, message_id = ? WHERE id = ?", [
      channelId,
      messageId,
      id,
    ]);
  }

  get(id: number): Entry | null {
    return this.db
      .query<Entry, [number]>(`SELECT ${COLUMNS} FROM feedback_entries WHERE id = ?`)
      .get(id);
  }

  /** New text; unread again, so the change shows up in `list`. */
  edit(id: number, text: string, now: number): void {
    this.db.run(
      "UPDATE feedback_entries SET text = ?, edited_at = ?, read_at = NULL WHERE id = ?",
      [text, now, id],
    );
  }

  /** The row stays, marked removed. */
  remove(id: number, now: number): void {
    this.db.run("UPDATE feedback_entries SET removed_at = ? WHERE id = ?", [now, id]);
  }

  /** Oldest first. */
  list(f: EntryFilter): Entry[] {
    const unread = f.all ? "1" : "read_at IS NULL AND removed_at IS NULL";

    return this.db
      .query<Entry, [string | null, string | null]>(
        `SELECT ${COLUMNS} FROM feedback_entries
         WHERE ${unread} AND (? IS NULL OR topic = ?) ORDER BY id`,
      )
      .all(f.topic, f.topic);
  }

  /** How many were marked: the given ids, or every unread one. */
  markRead(ids: number[] | "all", now: number): number {
    if (ids === "all") {
      return this.db.run("UPDATE feedback_entries SET read_at = ? WHERE read_at IS NULL", [now])
        .changes;
    }

    const marks = ids.map(() => "?").join(", ");

    return this.db.run(`UPDATE feedback_entries SET read_at = ? WHERE id IN (${marks})`, [
      now,
      ...ids,
    ]).changes;
  }
}
