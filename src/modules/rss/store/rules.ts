import type { RuleRow } from "./types.ts";
import type { Database } from "bun:sqlite";
import type { Rule, RuleKind } from "../rules/types.ts";

const toRule = (r: RuleRow): Rule => ({
  id: r.id,
  text: r.text,
  kind: r.kind,
  feedIds: (r.feed_ids?.split(",").map(Number) ?? []).toSorted((a, b) => a - b),
});

const SELECT = `
  SELECT r.id, r.text, r.kind, group_concat(f.feed_id) AS feed_ids
  FROM rss_rules r LEFT JOIN rss_rule_feeds f ON f.rule_id = r.id
  WHERE r.guild_id = ?`;

/** rss_rules + rss_rule_feeds: each server's rules and the feeds they're limited to. */
export class RuleStore {
  constructor(private readonly db: Database) {}

  add(guildId: string, text: string, kind: RuleKind): Rule {
    const row = this.db
      .query<{ id: number }, [string, string, string]>(
        "INSERT INTO rss_rules (guild_id, text, kind) VALUES (?, ?, ?) RETURNING id",
      )
      .get(guildId, text, kind);
    if (!row) throw new Error("rule insert returned nothing");
    return { id: row.id, text, kind, feedIds: [] };
  }

  remove(guildId: string, id: number): boolean {
    return this.db.transaction(() => {
      const removed =
        this.db.run("DELETE FROM rss_rules WHERE guild_id = ? AND id = ?", [guildId, id]).changes >
        0;
      if (removed) this.db.run("DELETE FROM rss_rule_feeds WHERE rule_id = ?", [id]);
      return removed;
    })();
  }

  list(guildId: string): Rule[] {
    return this.db
      .query<RuleRow, [string]>(`${SELECT} GROUP BY r.id ORDER BY r.id`)
      .all(guildId)
      .map(toRule);
  }

  get(guildId: string, id: number): Rule | null {
    const row = this.db
      .query<RuleRow, [string, number]>(`${SELECT} AND r.id = ? GROUP BY r.id`)
      .get(guildId, id);
    return row ? toRule(row) : null;
  }

  /** Limits a rule to these of the server's feeds (others are ignored); [] means every feed. */
  setFeeds(guildId: string, ruleId: number, feedIds: number[]): boolean {
    return this.db.transaction(() => {
      if (!this.get(guildId, ruleId)) return false;
      this.db.run("DELETE FROM rss_rule_feeds WHERE rule_id = ?", [ruleId]);
      for (const feedId of feedIds) {
        this.db.run(
          `INSERT OR IGNORE INTO rss_rule_feeds (rule_id, feed_id)
           SELECT ?, id FROM rss_feeds WHERE guild_id = ? AND id = ?`,
          [ruleId, guildId, feedId],
        );
      }
      return true;
    })();
  }

  /**
   * Unlinks a feed from every rule; a rule that applied to it alone is deleted, since with no
   * feeds left it would apply to every feed.
   */
  dropFeed(feedId: number): void {
    const scoped = this.db
      .query<{ rule_id: number }, [number]>("SELECT rule_id FROM rss_rule_feeds WHERE feed_id = ?")
      .all(feedId);
    this.db.run("DELETE FROM rss_rule_feeds WHERE feed_id = ?", [feedId]);
    for (const { rule_id: id } of scoped) {
      this.db.run(
        "DELETE FROM rss_rules WHERE id = ? AND NOT EXISTS (SELECT 1 FROM rss_rule_feeds WHERE rule_id = ?)",
        [id, id],
      );
    }
  }
}
