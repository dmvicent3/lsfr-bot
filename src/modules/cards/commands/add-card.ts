import { normalize } from "../../trivia/match.ts";
import { addReply } from "../components/replies.ts";
import { starterDeck } from "../data/load.ts";
import type { CardsRepo } from "../store/repo.ts";
import { type CardKind, validateCard } from "../text.ts";

const DUPLICATE = "That card is already in the deck.";

const REASONS: Record<CardKind, Record<"blanks" | "length" | "empty", string>> = {
  prompt: {
    blanks: "A prompt needs one or two blanks, written as ___.",
    length: "Prompts can be at most 150 characters.",
    empty: "That card is empty.",
  },
  answer: {
    blanks: "Answers can't have blanks (___).",
    length: "Answers can be at most 80 characters.",
    empty: "That card is empty.",
  },
};

let starterNorms: Set<string> | null = null;

/** The starter deck's texts, normalised, by kind. */
function inStarter(kind: CardKind, text: string): boolean {
  const deck = starterDeck();
  starterNorms ??= new Set([
    ...deck.prompts.map((c) => `prompt:${normalize(c.text)}`),
    ...deck.answers.map((c) => `answer:${normalize(c.text)}`),
  ]);

  return starterNorms.has(`${kind}:${normalize(text)}`);
}

/** Validates and adds a server card; the reply says what happened. */
export function addCard(
  repo: CardsRepo,
  c: { guildId: string; kind: CardKind; text: string; userId: string; now: number },
): string {
  const valid = validateCard(c.kind, c.text);

  if (!valid.ok) return REASONS[c.kind][valid.reason];

  if (inStarter(c.kind, valid.text)) return DUPLICATE;

  const id = repo.custom.add({ ...c, text: valid.text, addedBy: c.userId, at: c.now });

  return id === "duplicate" ? DUPLICATE : addReply(c.kind, { id, text: valid.text });
}
