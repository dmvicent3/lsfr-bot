import {
  ChannelType,
  InteractionContextType,
  SlashCommandBuilder,
  type SlashCommandStringOption,
} from "discord.js";

const title = (o: SlashCommandStringOption): SlashCommandStringOption =>
  o.setName("title").setDescription("Manga").setRequired(true).setAutocomplete(true);

export const data = new SlashCommandBuilder()
  .setName("manga")
  .setDescription("New MangaDex chapters of the manga you follow, posted with a ping")
  .setContexts(InteractionContextType.Guild)
  .addSubcommand((sub) =>
    sub.setName("follow").setDescription("Get pinged for new chapters").addStringOption(title),
  )
  .addSubcommand((sub) =>
    sub.setName("unfollow").setDescription("Stop following a manga").addStringOption(title),
  )
  .addSubcommand((sub) => sub.setName("list").setDescription("The manga you follow"))
  .addSubcommand((sub) =>
    sub
      .setName("channel")
      .setDescription("Post new chapters in a channel (Manage Server)")
      .addChannelOption((o) =>
        o
          .setName("channel")
          .setDescription("Manga channel")
          .setRequired(true)
          .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement),
      ),
  )
  .toJSON();
