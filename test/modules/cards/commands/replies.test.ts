import { expect, test } from "bun:test";
import { addCard } from "../../../../src/modules/cards/commands/add-card.ts";
import { addReply, voteReply } from "../../../../src/modules/cards/components/replies.ts";
import { CardsRepo } from "../../../../src/modules/cards/store/repo.ts";
import { Database } from "bun:sqlite";
import { runMigrations } from "../../../../src/core/db.ts";
import { cardsMigrations } from "../../../../src/modules/cards/store/migrations.ts";
import { starterDeck } from "../../../../src/modules/cards/data/load.ts";

function repo(): CardsRepo {
  const db = new Database(":memory:", { strict: true });
  runMigrations(db, cardsMigrations);

  return new CardsRepo(db);
}

const add = (r: CardsRepo, kind: "prompt" | "answer", text: string) =>
  addCard(r, { guildId: "g", kind, text, userId: "u1", now: 1 });

test("adding a card: rules, duplicates of server and starter cards", () => {
  const r = repo();
  const starter = starterDeck().answers[0]?.text ?? "";

  expect(add(r, "prompt", "Why ____?")).toBe("Added prompt #1: Why \\_\\_\\_?");
  expect(add(r, "prompt", "no blank")).toBe("A prompt needs one or two blanks, written as ___.");
  expect(add(r, "answer", "my ___")).toBe("Answers can't have blanks (___).");
  expect(add(r, "answer", "x".repeat(81))).toBe("Answers can be at most 80 characters.");
  expect(add(r, "prompt", "why ___")).toBe("That card is already in the deck.");
  expect(add(r, "answer", starter.toUpperCase())).toBe("That card is already in the deck.");
});

test("add replies escape markdown and say which kind", () => {
  expect(addReply("answer", { id: 3, text: "*hi*" })).toBe("Added answer #3: \\*hi\\*");
});

test("vote outcomes become short private replies", () => {
  expect(voteReply("own")).toBe("You can't vote for your own card.");
  expect(voteReply("changed")).toBe("Vote changed.");
  expect(voteReply("stale")).toBe("That round is over.");
});
