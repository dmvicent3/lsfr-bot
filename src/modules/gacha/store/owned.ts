import type { Database } from "bun:sqlite";
import type { PlayerRef } from "../../../core/points-types.ts";

/** gacha_owned: how many copies of each driver a player holds. */
export class OwnedStore {
  constructor(private readonly db: Database) {}

  /** Driver id → copies, every driver the player holds. */
  all(who: PlayerRef): Map<string, number> {
    const rows = this.db
      .query<{ driver_id: string; copies: number }, [string, string]>(
        "SELECT driver_id, copies FROM gacha_owned WHERE guild_id = ? AND user_id = ?",
      )
      .all(who.guildId, who.userId);

    return new Map(rows.map((r) => [r.driver_id, r.copies]));
  }

  /** Writes each driver's copies; a driver new to the player is stamped `now`. */
  save(who: PlayerRef, copies: ReadonlyMap<string, number>, now: number): void {
    const upsert = this.db.query(
      `INSERT INTO gacha_owned (guild_id, user_id, driver_id, copies, first_at) VALUES (?, ?, ?, ?, ?)
       ON CONFLICT (guild_id, user_id, driver_id) DO UPDATE SET copies = excluded.copies`,
    );

    for (const [id, n] of copies) upsert.run(who.guildId, who.userId, id, n, now);
  }
}
