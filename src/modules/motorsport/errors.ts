import { DiscordAPIError, RESTJSONErrorCodes } from "discord.js";

export function followErrorText(err: unknown): string {
  if (err instanceof DiscordAPIError && err.code === RESTJSONErrorCodes.MissingPermissions) {
    return "Couldn't set up the channel: the bot is missing Manage Channels, Manage Roles or Pin Messages.";
  }
  return `Couldn't set up the channel: ${err instanceof Error ? err.message : String(err)}`;
}
