import type { ChipRow, ChipWeekend } from "./types.ts";
import type { Chip, PlayedChip } from "../predictions/types.ts";
import { isChipKind } from "../predictions/chips.ts";
import type { SeriesKey } from "../types.ts";
import type { Database } from "bun:sqlite";

const COLUMNS = "user_id, event_id, chip, session_id, position";

/** A stored row as a chip; a chip kind this code no longer knows is none. */
function played(r: ChipRow): PlayedChip[] {
  if (!isChipKind(r.chip)) return [];

  const chip: Chip = { kind: r.chip, sessionId: r.session_id, position: r.position };

  return [{ userId: r.user_id, eventId: r.event_id, chip }];
}

/**
 * motorsport_chips: one chip per player per weekend, each chip kind once per player per season
 * (the table's keys enforce both).
 */
export class ChipStore {
  constructor(private readonly db: Database) {}

  get(s: SeriesKey, eventId: string, userId: string): Chip | null {
    const row = this.db
      .query<ChipRow, [string, string, string]>(
        `SELECT ${COLUMNS} FROM motorsport_chips WHERE series = ? AND event_id = ? AND user_id = ?`,
      )
      .get(s, eventId, userId);

    return (row && played(row)[0]?.chip) ?? null;
  }

  /** Plays `chip` on the weekend, replacing the weekend's earlier choice. */
  set(w: ChipWeekend, userId: string, chip: Chip, now: number): void {
    this.db.run(
      `INSERT INTO motorsport_chips
        (series, season, user_id, chip, event_id, session_id, position, chosen_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT (series, event_id, user_id) DO UPDATE SET
         season = excluded.season, chip = excluded.chip, session_id = excluded.session_id,
         position = excluded.position, chosen_at = excluded.chosen_at`,
      [w.series, w.season, userId, chip.kind, w.eventId, chip.sessionId, chip.position, now],
    );
  }

  clear(s: SeriesKey, eventId: string, userId: string): void {
    this.db.run("DELETE FROM motorsport_chips WHERE series = ? AND event_id = ? AND user_id = ?", [
      s,
      eventId,
      userId,
    ]);
  }

  /** The player's chips of one season. */
  season(s: SeriesKey, season: number, userId: string): PlayedChip[] {
    return this.db
      .query<ChipRow, [string, number, string]>(
        `SELECT ${COLUMNS} FROM motorsport_chips WHERE series = ? AND season = ? AND user_id = ?`,
      )
      .all(s, season, userId)
      .flatMap(played);
  }

  /** Every chip of the series, all seasons; one player's with `userId`. */
  all(s: SeriesKey, userId: string | null = null): PlayedChip[] {
    return this.db
      .query<ChipRow, [string, string | null, string | null]>(
        `SELECT ${COLUMNS} FROM motorsport_chips
         WHERE series = ? AND (? IS NULL OR user_id = ?)`,
      )
      .all(s, userId, userId)
      .flatMap(played);
  }
}
