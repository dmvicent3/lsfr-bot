import type {
  ChatInputCommandInteraction,
  MessageComponentInteraction,
  ModalSubmitInteraction,
} from "discord.js";
import { log } from "../../core/log.ts";

type Answered = ChatInputCommandInteraction | MessageComponentInteraction | ModalSubmitInteraction;

/**
 * A finished game's spoiler-free grid, posted publicly in the channel after the private answer;
 * mentions never ping. The game counts even when this can't be posted.
 */
export async function postShare(i: Answered, content: string): Promise<void> {
  try {
    await i.followUp({ content, allowedMentions: { parse: [] } });
  } catch (err) {
    log.error("word:share", `couldn't post the grid in ${i.channelId}`, err);
  }
}
