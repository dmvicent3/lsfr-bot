import type { Database } from "bun:sqlite";
import { jsonStrings } from "../../../core/guards.ts";
import type { PollKind, StoredPoll } from "../types.ts";

interface Row {
  guild_id: string;
  week: string;
  kind: string;
  channel_id: string | null;
  message_id: string | null;
  options: string;
  ends_at: number;
}

const toPoll = (r: Row): StoredPoll => ({
  guildId: r.guild_id,
  week: r.week,
  kind: r.kind === "five" ? "five" : "fours",
  channelId: r.channel_id,
  messageId: r.message_id,
  options: jsonStrings(r.options),
  endsAt: r.ends_at,
});

/** gacha_polls: the banner polls, one per kind per week; a failed post is kept with no message. */
export class PollStore {
  constructor(private readonly db: Database) {}

  /** Records the poll once: false when that week's poll of that kind was already recorded. */
  add(p: StoredPoll): boolean {
    return (
      this.db.run(
        `INSERT OR IGNORE INTO gacha_polls
         (guild_id, week, kind, channel_id, message_id, options, ends_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [p.guildId, p.week, p.kind, p.channelId, p.messageId, JSON.stringify(p.options), p.endsAt],
      ).changes === 1
    );
  }

  /** The week's polls by kind. */
  forWeek(guildId: string, week: string): Partial<Record<PollKind, StoredPoll>> {
    const rows = this.db
      .query<Row, [string, string]>("SELECT * FROM gacha_polls WHERE guild_id = ? AND week = ?")
      .all(guildId, week);

    return Object.fromEntries(rows.map((r) => [r.kind, toPoll(r)]));
  }
}
