import { escapeMarkdown } from "discord.js";

export const BLANK = "___";
const MAX_PROMPT = 150;
const MAX_ANSWER = 80;

export type CardKind = "prompt" | "answer";

export type Validated =
  | { ok: true; text: string }
  | { ok: false; reason: "blanks" | "length" | "empty" };

/** Runs of 3+ underscores become `___`; whitespace trimmed and single-spaced. */
export const normalizeBlanks = (text: string): string =>
  text.replace(/_{3,}/g, BLANK).replace(/\s+/g, " ").trim();

export const blanksIn = (text: string): number => text.split(BLANK).length - 1;

/** A prompt has 1–2 blanks and ≤ 150 characters; an answer none and ≤ 80. */
export function validateCard(kind: CardKind, raw: string): Validated {
  const text = normalizeBlanks(raw);
  const blanks = blanksIn(text);

  if (text.length === 0) return { ok: false, reason: "empty" };

  if (kind === "prompt" && (blanks < 1 || blanks > 2)) return { ok: false, reason: "blanks" };

  if (kind === "answer" && blanks > 0) return { ok: false, reason: "blanks" };

  if (text.length > (kind === "prompt" ? MAX_PROMPT : MAX_ANSWER))
    return { ok: false, reason: "length" };

  return { ok: true, text };
}

/** Each blank in turn takes the next answer, in bold, markdown-escaped, without a final period. */
export function fillPrompt(prompt: string, answers: string[]): string {
  const parts = prompt.split(BLANK);

  return parts
    .map((part, i) => {
      const answer = i < parts.length - 1 ? answers[i] : undefined;

      return answer === undefined
        ? part
        : `${part}**${escapeMarkdown(answer.replace(/\.$/, ""))}**`;
    })
    .join("");
}
