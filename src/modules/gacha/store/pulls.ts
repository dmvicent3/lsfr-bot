import type { Database } from "bun:sqlite";
import type { PlayerRef } from "../../../core/points-types.ts";
import type { Landed } from "../engine/types.ts";
import type { PullRow } from "../types.ts";
import type { NewPulls } from "./types.ts";

interface Row extends Omit<PullRow, "featured" | "tier"> {
  featured: number;
  tier: number;
}

const COLUMNS = "id, banner, driver_id AS driverId, tier, featured, level, cost, refund, at";
const MINE = "FROM gacha_pulls WHERE guild_id = ? AND user_id = ?";

const toPull = (r: Row): PullRow => ({
  ...r,
  tier: r.tier === 5 || r.tier === 4 ? r.tier : 3,
  featured: r.featured === 1,
});

/** gacha_pulls: every pull, with what it cost and gave back; the history and the spend ledger. */
export class PullStore {
  constructor(private readonly db: Database) {}

  add(who: PlayerRef, v: NewPulls): void {
    const insert = this.db.query(
      `INSERT INTO gacha_pulls
       (guild_id, user_id, banner, driver_id, tier, featured, level, cost, refund, at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    const row = (l: Landed) =>
      [l.driverId, l.tier, l.featured ? 1 : 0, l.level, v.price, l.refund, v.now] as const;

    for (const l of v.landed) insert.run(who.guildId, who.userId, v.banner, ...row(l));
  }

  /** What the player has paid for pulls and been given back. */
  ledger(who: PlayerRef): { spent: number; refunds: number } {
    const row = this.db
      .query<{ spent: number; refunds: number }, [string, string]>(
        `SELECT COALESCE(SUM(cost), 0) AS spent, COALESCE(SUM(refund), 0) AS refunds ${MINE}`,
      )
      .get(who.guildId, who.userId);

    return row ?? { spent: 0, refunds: 0 };
  }

  /** Newest first. */
  recent(who: PlayerRef, page: { limit: number; offset: number }): PullRow[] {
    return this.db
      .query<Row, [string, string, number, number]>(
        `SELECT ${COLUMNS} ${MINE} ORDER BY id DESC LIMIT ? OFFSET ?`,
      )
      .all(who.guildId, who.userId, page.limit, page.offset)
      .map(toPull);
  }

  /** Whether each limited ★5 was a featured one, oldest first: the 50/50 history. */
  limitedFives(who: PlayerRef): boolean[] {
    return this.db
      .query<{ featured: number }, [string, string]>(
        `SELECT featured ${MINE} AND banner = 'limited' AND tier = 5 ORDER BY id`,
      )
      .all(who.guildId, who.userId)
      .map((r) => r.featured === 1);
  }

  count(who: PlayerRef): number {
    const row = this.db
      .query<{ n: number }, [string, string]>(`SELECT COUNT(*) AS n ${MINE}`)
      .get(who.guildId, who.userId);

    return row?.n ?? 0;
  }
}
