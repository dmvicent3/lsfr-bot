import type { Database } from "bun:sqlite";
import { BannerStore } from "./banners.ts";
import { OwnedStore } from "./owned.ts";
import { PityStore } from "./pity.ts";
import { PollStore } from "./polls.ts";
import { PullStore } from "./pulls.ts";

/** The gacha tables, one store each. */
export class GachaRepo {
  readonly pity: PityStore;
  readonly owned: OwnedStore;
  readonly pulls: PullStore;
  readonly banners: BannerStore;
  readonly polls: PollStore;

  constructor(readonly db: Database) {
    this.pity = new PityStore(db);
    this.owned = new OwnedStore(db);
    this.pulls = new PullStore(db);
    this.banners = new BannerStore(db);
    this.polls = new PollStore(db);
  }
}
