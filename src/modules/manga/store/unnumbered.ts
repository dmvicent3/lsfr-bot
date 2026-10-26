import type { Database } from "bun:sqlite";

/** manga_unnumbered: oneshots and other chapters without a number, already posted. */
export class UnnumberedStore {
  constructor(private readonly db: Database) {}

  ids(): Set<string> {
    return new Set(
      this.db
        .query<{ chapter_id: string }, []>("SELECT chapter_id FROM manga_unnumbered")
        .all()
        .map((r) => r.chapter_id),
    );
  }

  add(chapterId: string, postedAt: number): void {
    this.db.run("INSERT OR IGNORE INTO manga_unnumbered (chapter_id, posted_at) VALUES (?, ?)", [
      chapterId,
      postedAt,
    ]);
  }

  /** Deletes rows posted before `before`; returns how many. */
  prune(before: number): number {
    return this.db.run("DELETE FROM manga_unnumbered WHERE posted_at < ?", [before]).changes;
  }
}
