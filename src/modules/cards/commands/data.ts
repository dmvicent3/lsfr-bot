import { InteractionContextType, SlashCommandBuilder } from "discord.js";

const PERIOD_CHOICES = [
  { name: "Today", value: "today" },
  { name: "This week", value: "week" },
  { name: "This month", value: "month" },
  { name: "All time", value: "all" },
];

const KIND_CHOICES = [
  { name: "Prompt (with ___ blanks)", value: "prompt" },
  { name: "Answer", value: "answer" },
];

export const data = new SlashCommandBuilder()
  .setName("cards")
  .setDescription("Gork Cards: fill in the blanks, vote for the funniest")
  .setContexts(InteractionContextType.Guild)
  .addSubcommand((sub) =>
    sub
      .setName("start")
      .setDescription("Open a lobby in this channel")
      .addIntegerOption((o) =>
        o
          .setName("points")
          .setDescription("Points to win (default 7)")
          .setMinValue(3)
          .setMaxValue(15),
      ),
  )
  .addSubcommand((sub) => sub.setName("stop").setDescription("Stop the game in this channel"))
  .addSubcommand((sub) =>
    sub
      .setName("add")
      .setDescription("Add a card to this server's deck")
      .addStringOption((o) =>
        o
          .setName("kind")
          .setDescription("Prompt or answer")
          .setRequired(true)
          .addChoices(...KIND_CHOICES),
      )
      .addStringOption((o) =>
        o
          .setName("text")
          .setDescription("The card; prompts need ___ blanks")
          .setRequired(true)
          .setMaxLength(200),
      ),
  )
  .addSubcommand((sub) =>
    sub
      .setName("remove")
      .setDescription("Remove a card you added (Manage Server: any card)")
      .addIntegerOption((o) =>
        o.setName("id").setDescription("Card number").setRequired(true).setMinValue(1),
      ),
  )
  .addSubcommand((sub) =>
    sub
      .setName("list")
      .setDescription("Cards this server added")
      .addBooleanOption((o) => o.setName("mine").setDescription("Only cards you added"))
      .addIntegerOption((o) => o.setName("page").setDescription("Page").setMinValue(1)),
  )
  .addSubcommand((sub) =>
    sub
      .setName("leaderboard")
      .setDescription("Round wins today, this week, this month or all time")
      .addStringOption((o) =>
        o
          .setName("period")
          .setDescription("Default: today")
          .addChoices(...PERIOD_CHOICES),
      )
      .addIntegerOption((o) => o.setName("page").setDescription("Page").setMinValue(1)),
  )
  .addSubcommand((sub) =>
    sub
      .setName("stats")
      .setDescription("Games, wins and best card")
      .addUserOption((o) => o.setName("member").setDescription("Whose stats (default: yours)")),
  )
  .toJSON();
