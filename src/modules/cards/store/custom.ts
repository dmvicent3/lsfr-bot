import type { Database } from "bun:sqlite";
import { normalize } from "../../trivia/match.ts";
import { asPrompt } from "../data/load.ts";
import type { CardKind } from "../text.ts";
import type { Card, Deck } from "../types.ts";

export interface CustomCard {
  id: number;
  kind: CardKind;
  text: string;
  addedBy: string;
}

const LIVE = "guild_id = ? AND removed_at IS NULL";

const card = (r: CustomCard): Card => ({ id: `c:${r.id}`, text: r.text });

/** cards_custom: cards a server added; live while `removed_at` is null. */
export class CustomStore {
  constructor(private readonly db: Database) {}

  /** The new card's id, or "duplicate" when the server already has it (case and punctuation aside). */
  add(c: {
    guildId: string;
    kind: CardKind;
    text: string;
    addedBy: string;
    at: number;
  }): number | "duplicate" {
    const norm = normalize(c.text);
    const taken = this.db
      .query(`SELECT 1 FROM cards_custom WHERE ${LIVE} AND kind = ? AND norm = ?`)
      .get(c.guildId, c.kind, norm);

    if (taken) return "duplicate";

    const { lastInsertRowid } = this.db
      .query(
        "INSERT INTO cards_custom (guild_id, kind, text, norm, added_by, added_at) VALUES (?, ?, ?, ?, ?, ?)",
      )
      .run(c.guildId, c.kind, c.text, norm, c.addedBy, c.at);

    return Number(lastInsertRowid);
  }

  /** The author can remove their card; a manager can remove any. */
  remove(r: {
    guildId: string;
    id: number;
    userId: string;
    manager: boolean;
  }): "removed" | "not-found" | "not-yours" {
    const row = this.db
      .query<{ addedBy: string }, [string, number]>(
        `SELECT added_by AS addedBy FROM cards_custom WHERE ${LIVE} AND id = ?`,
      )
      .get(r.guildId, r.id);

    if (!row) return "not-found";

    if (row.addedBy !== r.userId && !r.manager) return "not-yours";

    this.db.query("UPDATE cards_custom SET removed_at = ? WHERE id = ?").run(Date.now(), r.id);

    return "removed";
  }

  /** Live cards, newest first; only one member's when `addedBy` is set. */
  list(guildId: string, addedBy: string | null): CustomCard[] {
    return this.db
      .query<CustomCard, [string, string | null, string | null]>(
        `SELECT id, kind, text, added_by AS addedBy FROM cards_custom
         WHERE ${LIVE} AND (? IS NULL OR added_by = ?) ORDER BY id DESC`,
      )
      .all(guildId, addedBy, addedBy);
  }

  /** The server's live cards as a deck, oldest first. */
  live(guildId: string): Deck {
    const rows = this.list(guildId, null).toReversed();

    return {
      prompts: rows.filter((r) => r.kind === "prompt").map((r) => asPrompt(`c:${r.id}`, r.text)),
      answers: rows.filter((r) => r.kind === "answer").map(card),
    };
  }
}
