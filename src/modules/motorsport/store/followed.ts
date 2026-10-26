import type { FollowedRow } from "./types.ts";
import type { Followed, SeriesKey } from "../types.ts";
import { toSeriesKey } from "../series.ts";
import type { Database } from "bun:sqlite";

function toFollowed(row: FollowedRow): Followed {
  return {
    series: toSeriesKey(row.series),
    channelId: row.channel_id,
    roleId: row.role_id,
    pinnedMessageId: row.pinned_message_id,
    pinnedEventId: row.pinned_event_id,
    channelName: row.channel_name,
    renamedAt: row.renamed_at,
  };
}

const FOLLOWED_COLUMNS = {
  channelId: "channel_id",
  roleId: "role_id",
  pinnedMessageId: "pinned_message_id",
  pinnedEventId: "pinned_event_id",
  channelName: "channel_name",
  renamedAt: "renamed_at",
} as const satisfies Record<Exclude<keyof Followed, "series">, string>;
type FollowedPatchKey = keyof typeof FOLLOWED_COLUMNS;

function isPatchKey(k: string): k is FollowedPatchKey {
  return k in FOLLOWED_COLUMNS;
}

/** motorsport_followed: the series this server follows and their channel. */
export class FollowedStore {
  constructor(private readonly db: Database) {}

  list(): Followed[] {
    return this.db
      .query<FollowedRow, []>("SELECT * FROM motorsport_followed ORDER BY series")
      .all()
      .map(toFollowed);
  }

  get(s: SeriesKey): Followed | null {
    const row = this.db
      .query<FollowedRow, [string]>("SELECT * FROM motorsport_followed WHERE series = ?")
      .get(s);

    return row ? toFollowed(row) : null;
  }

  insert(f: Followed): void {
    this.db.run(
      `INSERT INTO motorsport_followed
        (series, channel_id, role_id, pinned_message_id, pinned_event_id, channel_name, renamed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        f.series,
        f.channelId,
        f.roleId,
        f.pinnedMessageId,
        f.pinnedEventId,
        f.channelName,
        f.renamedAt,
      ],
    );
  }

  update(s: SeriesKey, patch: Partial<Omit<Followed, "series">>): void {
    const keys = Object.keys(patch).filter(isPatchKey);

    if (keys.length === 0) return;

    const set = keys.map((k) => `${FOLLOWED_COLUMNS[k]} = ?`).join(", ");
    const values = keys.map((k) => patch[k] ?? null);
    this.db.run(`UPDATE motorsport_followed SET ${set} WHERE series = ?`, [...values, s]);
  }
}
