import { JevError, type JevQuestion } from "../../core/jev.ts";
import type { FeedItem } from "./parse.ts";

export interface Rule {
  id: number;
  text: string;
}

export type Verdict = { kind: "pass" } | { kind: "block"; rule: Rule };

/** An article is blocked when any rule's P(yes) reaches this. */
export const BLOCK_AT = 0.5;

/** A rule ending in "?" is asked as written; anything else is a topic. */
export function question(text: string): string {
  const t = text.trim();
  return t.endsWith("?") ? t : `Is this article about ${t}?`;
}

const key = (rule: Rule): string => `r${rule.id}`;

export function buildQuestions(rules: Rule[]): JevQuestion[] {
  return rules.map((rule) => ({ key: key(rule), instructions: question(rule.text) }));
}

export function verdict(answers: Map<string, number>, rules: Rule[]): Verdict {
  for (const rule of rules) {
    const p = answers.get(key(rule));
    if (p === undefined) throw new JevError(`no answer for rule ${rule.id}`);
    if (p >= BLOCK_AT) return { kind: "block", rule };
  }
  return { kind: "pass" };
}

/** The text jev reads for an article. */
export function articleState(item: FeedItem): string {
  return `${item.title}\n\n${item.description}`;
}
