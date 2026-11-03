import {
  ChannelType,
  InteractionContextType,
  type RESTPostAPIChatInputApplicationCommandsJSONBody,
  SlashCommandBuilder,
  type SlashCommandSubcommandBuilder,
} from "discord.js";

const settings = (sub: SlashCommandSubcommandBuilder): SlashCommandSubcommandBuilder =>
  sub
    .setName("settings")
    .setDescription("Channel for the developer's polls (Manage Server)")
    .addChannelOption((o) =>
      o
        .setName("channel")
        .setDescription("Poll channel")
        .setRequired(true)
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement),
    );

/** /feedback with one choice per topic. */
export function feedbackData(topics: string[]): RESTPostAPIChatInputApplicationCommandsJSONBody {
  return new SlashCommandBuilder()
    .setName("feedback")
    .setDescription("Tell Gork's developer what to fix or add")
    .setContexts(InteractionContextType.Guild)
    .addSubcommand((sub) =>
      sub
        .setName("give")
        .setDescription("Post feedback in this channel")
        .addStringOption((o) =>
          o
            .setName("topic")
            .setDescription("What it is about")
            .setRequired(true)
            .addChoices(...topics.map((t) => ({ name: t, value: t }))),
        ),
    )
    .addSubcommand(settings)
    .toJSON();
}
