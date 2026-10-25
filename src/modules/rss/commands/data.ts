import {
  ChannelType,
  InteractionContextType,
  PermissionFlagsBits,
  SlashCommandBuilder,
  type SlashCommandStringOption,
} from "discord.js";

function ruleOption(description: string) {
  return (o: SlashCommandStringOption): SlashCommandStringOption =>
    o
      .setName("rule")
      .setDescription(description)
      .setRequired(true)
      .setMinLength(1)
      .setMaxLength(200);
}

export const data = new SlashCommandBuilder()
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
