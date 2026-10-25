import { type MessageComponentInteraction, PermissionFlagsBits } from "discord.js";
import type { ComponentHandler } from "../../../core/types.ts";
import { ruleMessage } from "../rules/menus.ts";
import { RssRepo } from "../store/repo.ts";

const GONE = { content: "That rule no longer exists.", components: [] };

/** The server, when the clicker may manage it (replies are ephemeral to them, but check anyway). */
function managedGuild(i: MessageComponentInteraction): string | null {
  return i.guildId && i.memberPermissions?.has(PermissionFlagsBits.ManageGuild) ? i.guildId : null;
}

/** A rule's feed menu: the ticked feeds become the rule's feeds (none: every feed). */
const ruleFeeds: ComponentHandler = {
  id: "rss:feeds",
  async handle(i, args, ctx) {
    const guildId = managedGuild(i);
    if (!i.isStringSelectMenu() || !guildId) return;
    const repo = new RssRepo(ctx.db);
    const ruleId = Number(args[0]);
    const saved = repo.rules.setFeeds(guildId, ruleId, i.values.map(Number));
    const rule = saved ? repo.rules.get(guildId, ruleId) : null;
    await i.update(rule ? ruleMessage(rule, repo.feeds.list(guildId)) : GONE);
  },
};

/** /rss rules' picker: shows the chosen rule with its feed menu. */
const pickRule: ComponentHandler = {
  id: "rss:pick",
  async handle(i, _args, ctx) {
    const guildId = managedGuild(i);
    if (!i.isStringSelectMenu() || !guildId) return;
    const repo = new RssRepo(ctx.db);
    const rule = repo.rules.get(guildId, Number(i.values[0]));
    await i.update(rule ? ruleMessage(rule, repo.feeds.list(guildId)) : GONE);
  },
};

export const rssComponents: ComponentHandler[] = [ruleFeeds, pickRule];
