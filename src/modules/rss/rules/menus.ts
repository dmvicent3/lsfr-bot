import type { FeedRef, SelectRow } from "./types.ts";
import { ComponentType } from "discord.js";
import { describeRule, question, scopeOf } from "./rules.ts";
import type { Rule, RuleKind } from "./types.ts";

/** Discord's cap on a select menu's options. */
const MAX_OPTIONS = 25;

const cut = (s: string): string => (s.length > 100 ? `${s.slice(0, 99)}…` : s);

/** The feeds a rule applies to, as a multi-select; nothing ticked means every feed. */
export function feedMenu(rule: Rule, feeds: FeedRef[]): SelectRow | null {
  const shown = feeds.slice(0, MAX_OPTIONS);
  if (shown.length === 0) return null;
  return {
    type: ComponentType.ActionRow,
    components: [
      {
        type: ComponentType.StringSelect,
        custom_id: `rss:feeds:${rule.id}`,
        placeholder: "Applies to: all feeds",
        min_values: 0,
        max_values: shown.length,
        options: shown.map((f) => ({
          label: cut(f.name),
          value: String(f.id),
          default: rule.feedIds.includes(f.id),
        })),
      },
    ],
  };
}

/** Picks a rule to change (from /rss rules). */
export function rulePicker(rules: Rule[], feeds: FeedRef[]): SelectRow | null {
  if (rules.length === 0) return null;
  return {
    type: ComponentType.ActionRow,
    components: [
      {
        type: ComponentType.StringSelect,
        custom_id: "rss:pick",
        placeholder: "Change which feeds a rule applies to",
        options: rules.slice(0, MAX_OPTIONS).map((r) => ({
          label: cut(describeRule(r, feeds)),
          value: String(r.id),
        })),
      },
    ],
  };
}

const EFFECT: Record<RuleKind, (q: string) => string> = {
  block: (q) => `Articles are not posted when the answer to "${q}" is yes.`,
  only: (q) =>
    `Articles are posted only when the answer to "${q}" is yes (with several only-rules, one yes is enough).`,
};

/** What a rule does and where, with its feed menu. */
export function ruleMessage(
  rule: Rule,
  feeds: FeedRef[],
): { content: string; components: SelectRow[] } {
  const menu = feedMenu(rule, feeds);
  const hint = menu && rule.feedIds.length === 0 ? " Pick feeds below to limit it." : "";
  const where = `Applies to: ${scopeOf(rule, feeds)}.${hint}`;
  return {
    content: `${EFFECT[rule.kind](question(rule.text))}\n${where}`,
    components: menu ? [menu] : [],
  };
}
