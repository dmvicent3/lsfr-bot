import { MessageFlags } from "discord.js";
import { ruleMessage, rulePicker } from "../rules/menus.ts";
import { describeRule } from "../rules/rules.ts";
import type { Rule, RuleKind } from "../rules/types.ts";
import { addRule, RuleError } from "../subscriptions.ts";
import { reply } from "./kit.ts";
import type { CommandCtx, Handler } from "./types.ts";

const LEGEND =
  "🚫 blocks an article when the answer is yes. ✅ only: with any of these on a feed, its articles need one yes.";

function tryAdd({ i, guildId, repo }: CommandCtx, kind: RuleKind): Rule | string {
  try {
    return addRule(repo, guildId, i.options.getString("rule", true), kind);
  } catch (err) {
    if (err instanceof RuleError) return `Couldn't add that rule: ${err.message}.`;
    throw err;
  }
}

/** Adds the rule and replies with what it does and its feed menu. */
const adding =
  (kind: RuleKind): Handler =>
  async (c) => {
    const rule = tryAdd(c, kind);
    if (typeof rule === "string") return reply(c.i, rule);
    const msg = ruleMessage(rule, c.repo.feeds.list(c.guildId));
    await c.i.reply({ ...msg, content: `New rule. ${msg.content}`, flags: MessageFlags.Ephemeral });
  };

const removeRule: Handler = async ({ i, guildId, repo }) => {
  const id = Number(i.options.getString("rule", true));
  const removed = Number.isInteger(id) && repo.rules.remove(guildId, id);
  await reply(i, removed ? "Rule removed." : "No such rule; pick one from the list.");
};

const rules: Handler = async ({ i, guildId, repo }) => {
  const list = repo.rules.list(guildId);
  if (list.length === 0) {
    return reply(
      i,
      "No rules: every new article is posted. Add one with `/rss block` or `/rss only`.",
    );
  }
  const feeds = repo.feeds.list(guildId);
  const lines = list.map((r) => `- ${describeRule(r, feeds)}`).join("\n");
  const picker = feeds.length > 0 ? rulePicker(list, feeds) : null;
  await i.reply({
    content: `${LEGEND}\n${lines}`.slice(0, 2000),
    components: picker ? [picker] : [],
    flags: MessageFlags.Ephemeral,
  });
};

export const ruleHandlers: Record<string, Handler> = {
  block: adding("block"),
  only: adding("only"),
  "remove-rule": removeRule,
  rules,
};
