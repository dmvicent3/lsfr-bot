import type { Database } from "bun:sqlite";
import { jsonStrings } from "../../../core/guards.ts";
import type { Featured } from "../engine/types.ts";
import type { Banner } from "../types.ts";

interface Row {
  guild_id: string;
  week: string;
  five: string;
  fours: string;
  voted_five: number;
  voted_fours: number;
  started_at: number;
}

const toBanner = (r: Row): Banner => ({
  guildId: r.guild_id,
  week: r.week,
  featured: { five: r.five, fours: jsonStrings(r.fours) },
  voted: { five: r.voted_five === 1, fours: r.voted_fours === 1 },
  startedAt: r.started_at,
});

/** gacha_banners: each server's limited banner per week. */
export class BannerStore {
  constructor(private readonly db: Database) {}

  get(guildId: string, week: string): Banner | null {
    const row = this.db
      .query<Row, [string, string]>("SELECT * FROM gacha_banners WHERE guild_id = ? AND week = ?")
      .get(guildId, week);

    return row ? toBanner(row) : null;
  }

  /** Stores the week's banner once: false when the week already had one. */
  add(b: Banner): boolean {
    const { featured: f, voted } = b;

    return (
      this.db.run(
        `INSERT OR IGNORE INTO gacha_banners
         (guild_id, week, five, fours, voted_five, voted_fours, started_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          b.guildId,
          b.week,
          f.five,
          JSON.stringify(f.fours),
          +voted.five,
          +voted.fours,
          b.startedAt,
        ],
      ).changes === 1
    );
  }

  /** The featured drivers of the `n` banners before `week`, newest first. */
  before(guildId: string, week: string, n: number): Featured[] {
    return this.db
      .query<Row, [string, string, number]>(
        "SELECT * FROM gacha_banners WHERE guild_id = ? AND week < ? ORDER BY week DESC LIMIT ?",
      )
      .all(guildId, week, n)
      .map((r) => toBanner(r).featured);
  }
}
