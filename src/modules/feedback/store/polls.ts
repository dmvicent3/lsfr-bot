import type { Database } from "bun:sqlite";
import { jsonStrings } from "../../../core/guards.ts";
import type { NewPoll, StoredPoll } from "../types.ts";

interface PollRow extends Omit<StoredPoll, "options" | "multi"> {
  options: string;
  multi: number;
}

const COLUMNS = `id, guild_id AS guildId, channel_id AS channelId, message_id AS messageId,
  question, options, multi, created_at AS createdAt, ends_at AS endsAt`;

const toPoll = (r: PollRow): StoredPoll => ({
  ...r,
  options: jsonStrings(r.options),
  multi: r.multi === 1,
});

/** feedback_polls: the polls posted by the script, kept for reading results. */
export class PollStore {
  constructor(private readonly db: Database) {}

  /** The new poll's id. */
  add(p: NewPoll): number {
    return Number(
      this.db.run(
        `INSERT INTO feedback_polls
         (guild_id, channel_id, message_id, question, options, multi, created_at, ends_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          p.guildId,
          p.channelId,
          p.messageId,
          p.question,
          JSON.stringify(p.options),
          p.multi ? 1 : 0,
          p.createdAt,
          p.endsAt,
        ],
      ).lastInsertRowid,
    );
  }

  get(id: number): StoredPoll | null {
    const row = this.db
      .query<PollRow, [number]>(`SELECT ${COLUMNS} FROM feedback_polls WHERE id = ?`)
      .get(id);

    return row ? toPoll(row) : null;
  }

  /** Records that the poll ended at `now` (closed early). */
  close(id: number, now: number): void {
    this.db.run("UPDATE feedback_polls SET ends_at = ? WHERE id = ?", [now, id]);
  }

  /** Oldest first. */
  all(): StoredPoll[] {
    return this.db
      .query<PollRow, []>(`SELECT ${COLUMNS} FROM feedback_polls ORDER BY id`)
      .all()
      .map(toPoll);
  }
}
