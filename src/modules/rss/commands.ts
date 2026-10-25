import {
  type AutocompleteInteraction,
  ChannelType,
  type ChatInputCommandInteraction,
  InteractionContextType,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import type { Ctx, SlashCommand } from "../../core/module.ts";
import { addRule, followFeed, RuleError } from "./cycle.ts";
import { fetchFeed } from "./fetch.ts";
import { FeedError } from "./parse.ts";
import { RssRepo } from "./repo.ts";
import { question } from "./rules.ts";

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
      .addStringOption((o) =>
        o
          .setName("rule")
          .setDescription('A topic ("sports") or a question ("Is it an advertisement?")')
          .setRequired(true)
          .setMinLength(1)
          .setMaxLength(200),
      ),
  )
  .addSubcommand((sub) =>
    sub
      .setName("unblock")
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
    case "block": {
      let rule;
      try {
        rule = addRule(repo, guildId, i.options.getString("rule", true));
      } catch (err) {
        if (err instanceof RuleError) return reply(i, `Couldn't add that rule: ${err.message}.`);
        throw err;
      }
      return reply(
        i,
        `New rule: articles are not posted when the answer to "${question(rule.text)}" is yes.`,
      );
    }
    case "unblock": {
      const id = Number(i.options.getString("rule", true));
      const removed = Number.isInteger(id) && repo.removeRule(guildId, id);
      return reply(i, removed ? "Rule removed." : "No such rule; pick one from the list.");
    }
    case "rules": {
      const rules = repo.rules(guildId);
      if (rules.length === 0)
        return reply(i, "No rules: every new article is posted. Add one with `/rss block`.");
      return reply(
        i,
        `Articles are not posted when any answer is yes:\n${rules.map((r) => `- ${question(r.text)}`).join("\n")}`.slice(
          0,
          2000,
        ),
      );
    }
    default:
      return reply(i, "Unknown subcommand.");
  }
}

async function autocomplete(i: AutocompleteInteraction, ctx: Ctx): Promise<void> {
  const guildId = i.guildId;
  if (!guildId) return i.respond([]);
  const repo = new RssRepo(ctx.db);
  const items =
    i.options.getSubcommand() === "unfollow"
      ? repo.feeds(guildId).map((f) => ({ name: f.name, value: String(f.id) }))
      : repo.rules(guildId).map((r) => ({ name: r.text, value: String(r.id) }));
  await i.respond(autocompleteChoices(items, i.options.getFocused()));
}

export const rssCommand: SlashCommand = { data, global: true, execute, autocomplete };
