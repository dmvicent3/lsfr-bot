import type { Database } from "bun:sqlite";
import { EntryStore } from "./entries.ts";
import { PollStore } from "./polls.ts";

/** The feedback tables, one store each. */
export class FeedbackRepo {
  readonly entries: EntryStore;
  readonly polls: PollStore;

  constructor(db: Database) {
    this.entries = new EntryStore(db);
    this.polls = new PollStore(db);
  }
}
