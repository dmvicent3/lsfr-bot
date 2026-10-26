import { type Interaction, MessageFlags, type RepliableInteraction } from "discord.js";
import { log } from "./log.ts";
import type { Ctx } from "./types.ts";
import type { Router } from "./types.ts";

/**
 * Buttons on old messages (e.g. from the previous bot) or a command Discord still lists
 * after it was removed: answer, instead of leaving "This interaction failed".
 */
async function replyStale(
  interaction: RepliableInteraction,
  what: "button" | "command",
): Promise<void> {
  await interaction.reply({
    content: `This ${what} doesn't work any more. Try /help for what Gork can do now.`,
    flags: MessageFlags.Ephemeral,
  });
}

async function dispatch(interaction: Interaction, router: Router, ctx: Ctx): Promise<void> {
  if (interaction.isChatInputCommand()) {
    const command = router.command(interaction.commandName);

    return command ? command.execute(interaction, ctx) : replyStale(interaction, "command");
  }

  if (interaction.isAutocomplete()) {
    return router.command(interaction.commandName)?.autocomplete?.(interaction, ctx);
  }

  if (!interaction.isMessageComponent()) return;

  const route = router.component(interaction.customId);

  return route
    ? route.handler.handle(interaction, route.args, ctx)
    : replyStale(interaction, "button");
}

/** Tells the user a handler failed, as a reply or, once one was sent, a follow-up. */
async function reportFailure(interaction: Interaction, err: unknown): Promise<void> {
  log.error("core:interaction", "handler failed", err);

  if (!interaction.isRepliable()) return;

  const message = err instanceof Error ? err.message : String(err);
  const reply = {
    content: `Something went wrong: ${message}`,
    flags: MessageFlags.Ephemeral,
  } as const;
  await (interaction.replied || interaction.deferred
    ? interaction.followUp(reply)
    : interaction.reply(reply));
}

/** Sends an interaction to its command, autocomplete or component handler. */
export async function routeInteraction(
  interaction: Interaction,
  router: Router,
  ctx: Ctx,
): Promise<void> {
  try {
    await dispatch(interaction, router, ctx);
  } catch (err) {
    await reportFailure(interaction, err);
  }
}
