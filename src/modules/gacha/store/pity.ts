import type { Database } from "bun:sqlite";
import type { PlayerRef } from "../../../core/points-types.ts";
import type { BannerKind, Pity } from "../engine/types.ts";

interface PityRow {
  five: number;
  four: number;
  guarantee_five: number;
  guarantee_four: number;
}

export const FRESH: Pity = { five: 0, four: 0, guaranteeFive: false, guaranteeFour: false };

const toPity = (r: PityRow): Pity => ({
  five: r.five,
  four: r.four,
  guaranteeFive: r.guarantee_five === 1,
  guaranteeFour: r.guarantee_four === 1,
});

/** gacha_pity: each player's counters and guarantees per banner kind. */
export class PityStore {
  constructor(private readonly db: Database) {}

  get(who: PlayerRef, banner: BannerKind): Pity {
    const row = this.db
      .query<PityRow, [string, string, string]>(
        "SELECT * FROM gacha_pity WHERE guild_id = ? AND user_id = ? AND banner = ?",
      )
      .get(who.guildId, who.userId, banner);

    return row ? toPity(row) : FRESH;
  }

  set(who: PlayerRef, banner: BannerKind, p: Pity): void {
    this.db.run(
      `INSERT OR REPLACE INTO gacha_pity
       (guild_id, user_id, banner, five, four, guarantee_five, guarantee_four)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        who.guildId,
        who.userId,
        banner,
        p.five,
        p.four,
        p.guaranteeFive ? 1 : 0,
        p.guaranteeFour ? 1 : 0,
      ],
    );
  }
}
