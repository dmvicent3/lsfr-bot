import type { APIActionRowComponent, APIStringSelectComponent } from "discord.js";

export type FeedRef = { id: number; name: string };

export type SelectRow = APIActionRowComponent<APIStringSelectComponent>;

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
