import { Database } from "bun:sqlite";
import { runMigrations } from "../../../src/core/db.ts";
import { coreMigrations } from "../../../src/core/settings.ts";
import type { Ctx } from "../../../src/core/types.ts";
import { feedbackMigrations } from "../../../src/modules/feedback/store/migrations.ts";
import { FeedbackRepo } from "../../../src/modules/feedback/store/repo.ts";
import type { NewEntry } from "../../../src/modules/feedback/types.ts";

/** In-memory feedback tables. */
export function setup() {
  const db = new Database(":memory:", { strict: true });
  runMigrations(db, [...coreMigrations, ...feedbackMigrations]);

  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- handlers only read ctx.db
  return { db, repo: new FeedbackRepo(db), ctx: { db } as unknown as Ctx };
}

export const newEntry = (over: Partial<NewEntry> = {}): NewEntry => ({
  guildId: "g",
  userId: "u1",
  topic: "crossword",
  text: "The clues are too hard",
  now: 1000,
  ...over,
});
