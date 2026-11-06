import {
  ChannelType,
  InteractionContextType,
  SlashCommandBuilder,
  type SlashCommandSubcommandBuilder,
} from "discord.js";
import { PRICE_RANGE } from "../engine/balance.ts";

const pull = (sub: SlashCommandSubcommandBuilder): SlashCommandSubcommandBuilder =>
  sub
    .setName("pull")
    .setDescription("Spend currency on drivers; private, ★5s are announced")
    .addIntegerOption((o) =>
      o
        .setName("count")
        .setDescription("1 or 10 pulls (default 1)")
        .addChoices({ name: "1", value: 1 }, { name: "10", value: 10 }),
    )
    .addStringOption((o) =>
      o
        .setName("banner")
        .setDescription("Default: this week's limited banner")
        .addChoices({ name: "limited", value: "limited" }, { name: "standard", value: "standard" }),
    );

const settings = (sub: SlashCommandSubcommandBuilder): SlashCommandSubcommandBuilder =>
  sub
    .setName("settings")
    .setDescription("Channel, pull price and time zone (Manage Server)")
    .addChannelOption((o) =>
      o
        .setName("channel")
        .setDescription("Where banner polls and news go")
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement),
    )
    .addIntegerOption((o) =>
      o
        .setName("price")
        .setDescription("Currency per pull")
        .setMinValue(PRICE_RANGE.min)
        .setMaxValue(PRICE_RANGE.max),
    )
    .addStringOption((o) =>
      o
        .setName("timezone")
        .setDescription("IANA time zone for the week, e.g. Europe/Lisbon")
        .setMaxLength(64),
    );

const page = (what: string) => (sub: SlashCommandSubcommandBuilder) =>
  sub.addIntegerOption((o) => o.setName("page").setDescription(`Page of ${what}`).setMinValue(1));

export const data = new SlashCommandBuilder()
  .setName("gacha")
  .setDescription("Collect every F1 driver since 1950 with the points you earn in Gork's games")
  .setContexts(InteractionContextType.Guild)
  .addSubcommand(pull)
  .addSubcommand((sub) =>
    sub.setName("banner").setDescription("This week's limited banner and the polls for the next"),
  )
  .addSubcommand((sub) =>
    sub.setName("balance").setDescription("Your currency, where it came from, and your pity"),
  )
  .addSubcommand((sub) =>
    page("drivers")(
      sub
        .setName("collection")
        .setDescription("Drivers owned, by tier, with their levels")
        .addUserOption((o) =>
          o.setName("user").setDescription("Whose collection (default: yours)"),
        ),
    ),
  )
  .addSubcommand((sub) => page("pulls")(sub.setName("history").setDescription("Your recent pulls")))
  .addSubcommand(settings)
  .toJSON();
