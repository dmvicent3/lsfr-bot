import type { AutocompleteInteraction, ChatInputCommandInteraction } from "discord.js";
import type { Ctx, SlashCommand } from "../../../core/module.ts";
import { describeRule } from "../rules/rules.ts";
import { RssRepo } from "../store/repo.ts";
import { data } from "./data.ts";
import { feedHandlers } from "./feeds.ts";
import { autocompleteChoices, type Handler, reply } from "./kit.ts";
import { ruleHandlers } from "./rules.ts";

const HANDLERS: Record<string, Handler> = { ...feedHandlers, ...ruleHandlers };

async function execute(i: ChatInputCommandInteraction, ctx: Ctx): Promise<void> {
  const guildId = i.guildId;
  if (!guildId) return reply(i, "Use this in a server.");
  const handler = HANDLERS[i.options.getSubcommand()];
  if (!handler) return reply(i, "Unknown subcommand.");
  await handler({ i, guildId, repo: new RssRepo(ctx.db) });
}

/** unfollow offers the server's feeds; remove-rule its rules, described. */
async function autocomplete(i: AutocompleteInteraction, ctx: Ctx): Promise<void> {
  const guildId = i.guildId;
  if (!guildId) return i.respond([]);
  const repo = new RssRepo(ctx.db);
  const feeds = repo.feeds.list(guildId);
  const items =
    i.options.getSubcommand() === "unfollow"
      ? feeds.map((f) => ({ name: f.name, value: String(f.id) }))
      : repo.rules
          .list(guildId)
          .map((r) => ({ name: describeRule(r, feeds), value: String(r.id) }));
  await i.respond(autocompleteChoices(items, i.options.getFocused()));
}

export const rssCommand: SlashCommand = { data, global: true, execute, autocomplete };
