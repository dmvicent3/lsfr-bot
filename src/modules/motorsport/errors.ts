import { DiscordAPIError, RESTJSONErrorCodes } from "discord.js";

export function followErrorText(err: unknown): string {
  if (err instanceof DiscordAPIError && err.code === RESTJSONErrorCodes.MissingPermissions) {
    return "Couldn't set up the channel: the bot is missing Manage Channels, Manage Roles or Pin Messages.";
  }
  return `Couldn't set up the channel: ${err instanceof Error ? err.message : String(err)}`;
}

const HOPELESS_DELETE = new Set<number>([
  RESTJSONErrorCodes.UnknownChannel,
  RESTJSONErrorCodes.UnknownMessage,
  RESTJSONErrorCodes.MissingAccess,
  RESTJSONErrorCodes.MissingPermissions,
]);

/**
 * Deleting an old ping failed in a way retrying won't fix (it's gone, or the bot lost
 * access), so cleanup should stop trying instead of failing every minute.
 */
export function pingDeleteIsHopeless(err: unknown): boolean {
  return (
    err instanceof DiscordAPIError && typeof err.code === "number" && HOPELESS_DELETE.has(err.code)
  );
}
