import {
  type AutocompleteInteraction,
  ChannelType,
  type ChatInputCommandInteraction,
  InteractionContextType,
  type MessageComponentInteraction,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
  type SlashCommandStringOption,
} from "discord.js";
import type { ComponentHandler, Ctx, SlashCommand } from "../../core/module.ts";
import { addRule, followFeed, RuleError } from "./cycle.ts";
import { fetchFeed } from "./fetch.ts";
import { ruleMessage, rulePicker } from "./menus.ts";
import { FeedError } from "./parse.ts";
import { RssRepo } from "./repo.ts";
import { describeRule, type RuleKind } from "./rules.ts";

function ruleOption(description: string) {
  return (o: SlashCommandStringOption): SlashCommandStringOption =>
    o
      .setName("rule")
      .setDescription(description)
      .setRequired(true)
      .setMinLength(1)
      .setMaxLength(200);
}

const data = new SlashCommandBuilder()
  .setName("rss")
  .setDescription("News feeds, filtered by this server's rules")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .setContexts(InteractionContextType.Guild)
  .addSubcommand((sub) =>
    sub
      .setName("channel")
      .setDescription("Post news in this channel (or the one given)")
      .addChannelOption((o) =>
        o
          .setName("channel")
          .setDescription("News channel")
          .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement),
      ),
  )
  .addSubcommand((sub) =>
    sub
      .setName("follow")
      .setDescription("Follow an RSS or Atom feed")
      .addStringOption((o) => o.setName("url").setDescription("Feed URL").setRequired(true))
      .addStringOption((o) =>
        o
          .setName("name")
          .setDescription("Name shown on posts (default: the feed's title)")
          .setMaxLength(100),
      ),
  )
  .addSubcommand((sub) =>
    sub
      .setName("unfollow")
      .setDescription("Stop following a feed")
      .addStringOption((o) =>
        o.setName("feed").setDescription("Feed").setRequired(true).setAutocomplete(true),
      ),
  )
  .addSubcommand((sub) => sub.setName("feeds").setDescription("List followed feeds"))
  .addSubcommand((sub) =>
    sub
      .setName("block")
      .setDescription("Don't post articles about a topic (or matching a yes/no question)")
      .addStringOption(ruleOption('A topic ("sports") or a question ("Is it an advertisement?")')),
  )
  .addSubcommand((sub) =>
    sub
      .setName("only")
      .setDescription("Post only articles about a topic (or matching a yes/no question)")
      .addStringOption(ruleOption('A topic ("Europe") or a question ("Does it affect Europe?")')),
  )
  .addSubcommand((sub) =>
    sub
      .setName("remove-rule")
      .setDescription("Remove a rule")
      .addStringOption((o) =>
        o.setName("rule").setDescription("Rule").setRequired(true).setAutocomplete(true),
      ),
  )
  .addSubcommand((sub) => sub.setName("rules").setDescription("List this server's rules"))
  .toJSON();

export function autocompleteChoices(
  items: { name: string; value: string }[],
  typed: string,
): { name: string; value: string }[] {
  const t = typed.toLowerCase();
  return items
    .filter((c) => c.name.toLowerCase().includes(t))
    .slice(0, 25)
    .map((c) => ({ name: c.name.slice(0, 100), value: c.value }));
}

async function reply(i: ChatInputCommandInteraction, content: string): Promise<void> {
  await (i.deferred
    ? i.editReply({ content })
    : i.reply({ content, flags: MessageFlags.Ephemeral }));
}

function isHttpUrl(s: string): boolean {
  try {
    const url = new URL(s);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

async function execute(i: ChatInputCommandInteraction, ctx: Ctx): Promise<void> {
  const guildId = i.guildId;
  if (!guildId) return reply(i, "Use this in a server.");
  const repo = new RssRepo(ctx.db);
  const channelHint = (): string => {
    const channel = repo.channel(guildId);
    return channel ? `in <#${channel}>` : "once a channel is set with `/rss channel`";
  };

  switch (i.options.getSubcommand()) {
    case "channel": {
      const channelId = i.options.getChannel("channel")?.id ?? i.channelId;
      repo.setChannel(guildId, channelId);
      return reply(i, `News will be posted in <#${channelId}>.`);
    }
    case "follow": {
      const url = i.options.getString("url", true).trim();
      if (!isHttpUrl(url)) return reply(i, "That isn't an http(s) URL.");
      await i.deferReply({ flags: MessageFlags.Ephemeral });
      try {
        const feed = await followFeed(
          repo,
          guildId,
          url,
          i.options.getString("name"),
          (u) => fetchFeed(u),
          Date.now(),
        );
        return await reply(
          i,
          `Following **${feed.name}**. New articles will appear ${channelHint()}.`,
        );
      } catch (err) {
        if (err instanceof FeedError) return reply(i, `Couldn't follow that feed: ${err.message}`);
        throw err;
      }
    }
    case "unfollow": {
      const id = Number(i.options.getString("feed", true));
      const removed = Number.isInteger(id) && repo.removeFeed(guildId, id);
      return reply(i, removed ? "Unfollowed." : "No such feed; pick one from the list.");
    }
    case "feeds": {
      const feeds = repo.feeds(guildId);
      if (feeds.length === 0) return reply(i, "No feeds yet. Add one with `/rss follow`.");
      const lines = feeds.map(
        (f) =>
          `- **${f.name}** <${f.url}>${f.failures > 0 ? ` ⚠️ failing (${f.failures} in a row)` : ""}`,
      );
      return reply(i, `Posting ${channelHint()}:\n${lines.join("\n")}`.slice(0, 2000));
    }
    case "block":
    case "only": {
      const kind: RuleKind = i.options.getSubcommand() === "only" ? "only" : "block";
      let rule;
      try {
        rule = addRule(repo, guildId, i.options.getString("rule", true), kind);
      } catch (err) {
        if (err instanceof RuleError) return reply(i, `Couldn't add that rule: ${err.message}.`);
        throw err;
      }
      const msg = ruleMessage(rule, repo.feeds(guildId));
      await i.reply({ ...msg, content: `New rule. ${msg.content}`, flags: MessageFlags.Ephemeral });
      return;
    }
    case "remove-rule": {
      const id = Number(i.options.getString("rule", true));
      const removed = Number.isInteger(id) && repo.removeRule(guildId, id);
      return reply(i, removed ? "Rule removed." : "No such rule; pick one from the list.");
    }
    case "rules": {
      const rules = repo.rules(guildId);
      const feeds = repo.feeds(guildId);
      if (rules.length === 0) {
        return reply(
          i,
          "No rules: every new article is posted. Add one with `/rss block` or `/rss only`.",
        );
      }
      const lines = rules.map((r) => `- ${describeRule(r, feeds)}`).join("\n");
      const picker = rulePicker(rules, feeds);
      await i.reply({
        content:
          `🚫 blocks an article when the answer is yes. ✅ only: with any of these on a feed, its articles need one yes.\n${lines}`.slice(
            0,
            2000,
          ),
        components: picker && feeds.length > 0 ? [picker] : [],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    default:
      return reply(i, "Unknown subcommand.");
  }
}

async function autocomplete(i: AutocompleteInteraction, ctx: Ctx): Promise<void> {
  const guildId = i.guildId;
  if (!guildId) return i.respond([]);
  const repo = new RssRepo(ctx.db);
  const feeds = repo.feeds(guildId);
  const items =
    i.options.getSubcommand() === "unfollow"
      ? feeds.map((f) => ({ name: f.name, value: String(f.id) }))
      : repo.rules(guildId).map((r) => ({ name: describeRule(r, feeds), value: String(r.id) }));
  await i.respond(autocompleteChoices(items, i.options.getFocused()));
}

export const rssCommand: SlashCommand = { data, global: true, execute, autocomplete };

/** Component replies are ephemeral to whoever ran /rss, but check anyway. */
function canManage(i: MessageComponentInteraction): string | null {
  return i.guildId && i.memberPermissions?.has(PermissionFlagsBits.ManageGuild) ? i.guildId : null;
}

/** A rule's feed menu: the ticked feeds become the rule's feeds (none: every feed). */
const ruleFeeds: ComponentHandler = {
  id: "rss:feeds",
  async handle(i, args, ctx) {
    const guildId = canManage(i);
    if (!i.isStringSelectMenu() || !guildId) return;
    const repo = new RssRepo(ctx.db);
    const ruleId = Number(args[0]);
    const feedIds = i.values.map(Number);
    if (!repo.setRuleFeeds(guildId, ruleId, feedIds)) {
      await i.update({ content: "That rule no longer exists.", components: [] });
      return;
    }
    const rule = repo.rule(guildId, ruleId);
    if (rule) await i.update(ruleMessage(rule, repo.feeds(guildId)));
  },
};

/** /rss rules' picker: shows the chosen rule with its feed menu. */
const pickRule: ComponentHandler = {
  id: "rss:pick",
  async handle(i, _args, ctx) {
    const guildId = canManage(i);
    if (!i.isStringSelectMenu() || !guildId) return;
    const repo = new RssRepo(ctx.db);
    const rule = repo.rule(guildId, Number(i.values[0]));
    await i.update(
      rule
        ? ruleMessage(rule, repo.feeds(guildId))
        : { content: "That rule no longer exists.", components: [] },
    );
  },
};

export const rssComponents: ComponentHandler[] = [ruleFeeds, pickRule];
