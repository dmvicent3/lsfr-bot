import { JevError, type JevQuestion } from "../../../core/jev.ts";
import type { FeedItem } from "../feeds/parse.ts";

/** A block rule stops an article; with only-rules, an article must match one of them. */
export type RuleKind = "block" | "only";

export interface Rule {
  id: number;
  text: string;
  kind: RuleKind;
  /** The feeds it applies to; empty: every feed. */
  feedIds: number[];
}

export type Verdict = { kind: "pass" } | { kind: "block"; rule: Rule } | { kind: "off-topic" };

/** A rule matches when its P(yes) reaches this. */
export const MATCH_AT = 0.5;

/** A rule ending in "?" is asked as written; anything else is a topic. */
export function question(text: string): string {
  const t = text.trim();
  return t.endsWith("?") ? t : `Is this article about ${t}?`;
}

const key = (rule: Rule): string => `r${rule.id}`;

export function buildQuestions(rules: Rule[]): JevQuestion[] {
  return rules.map((rule) => ({ key: key(rule), instructions: question(rule.text) }));
}

/** The rules an article from `feedId` is checked against. */
export function rulesFor(rules: Rule[], feedId: number): Rule[] {
  return rules.filter((r) => r.feedIds.length === 0 || r.feedIds.includes(feedId));
}

export function verdict(answers: Map<string, number>, rules: Rule[]): Verdict {
  const matches = (rule: Rule): boolean => {
    const p = answers.get(key(rule));
    if (p === undefined) throw new JevError(`no answer for rule ${rule.id}`);
    return p >= MATCH_AT;
  };
  const matched = rules.filter(matches);
  const blocking = matched.find((r) => r.kind === "block");
  if (blocking) return { kind: "block", rule: blocking };
  const onTopic = !rules.some((r) => r.kind === "only") || matched.some((r) => r.kind === "only");
  return onTopic ? { kind: "pass" } : { kind: "off-topic" };
}

const MARK: Record<RuleKind, string> = { block: "🚫", only: "✅ only:" };

/** "all feeds" or the names of the feeds a rule is limited to. */
export function scopeOf(rule: Rule, feeds: { id: number; name: string }[]): string {
  if (rule.feedIds.length === 0) return "all feeds";
  return feeds
    .filter((f) => rule.feedIds.includes(f.id))
    .map((f) => f.name)
    .join(", ");
}

/** "🚫 <question> (all feeds)" or "✅ only: <question> (TASS, Euronews)". */
export function describeRule(rule: Rule, feeds: { id: number; name: string }[]): string {
  return `${MARK[rule.kind]} ${question(rule.text)} (${scopeOf(rule, feeds)})`;
}

/** The text jev reads for an article. */
export function articleState(item: FeedItem): string {
  return `${item.title}\n\n${item.description}`;
}
