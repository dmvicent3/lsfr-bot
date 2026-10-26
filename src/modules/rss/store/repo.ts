import type { Database } from "bun:sqlite";
import { FeedStore } from "./feeds.ts";
import { ItemStore } from "./items.ts";
import { RuleStore } from "./rules.ts";
import { ServerStore } from "./servers.ts";

/** The rss tables, one store each; operations spanning stores live here. */
export class RssRepo {
  readonly servers: ServerStore;
  readonly feeds: FeedStore;
  readonly rules: RuleStore;
  readonly items: ItemStore;

  constructor(private readonly db: Database) {
    this.servers = new ServerStore(db);
    this.feeds = new FeedStore(db);
    this.rules = new RuleStore(db);
    this.items = new ItemStore(db);
  }

  /** Removes a feed with its waiting items and the rules that applied to it alone. */
  unfollow(guildId: string, feedId: number): boolean {
    return this.db.transaction(() => {
      if (!this.feeds.remove(guildId, feedId)) return false;

      this.items.dropWaiting(guildId, feedId);
      this.rules.dropFeed(feedId);

      return true;
    })();
  }
}
