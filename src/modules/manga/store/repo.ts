import type { Database } from "bun:sqlite";
import { FollowStore } from "./follows.ts";
import { SeriesStore } from "./series.ts";
import { UnnumberedStore } from "./unnumbered.ts";

/** The manga tables, one store each. */
export class MangaRepo {
  readonly series: SeriesStore;
  readonly follows: FollowStore;
  readonly unnumbered: UnnumberedStore;

  constructor(db: Database) {
    this.series = new SeriesStore(db);
    this.follows = new FollowStore(db);
    this.unnumbered = new UnnumberedStore(db);
  }
}
