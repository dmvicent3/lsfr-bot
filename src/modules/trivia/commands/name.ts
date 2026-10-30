import type { BaseInteraction } from "discord.js";

/** The server nickname when there is one, else the account's display name. */
export const memberName = (i: BaseInteraction): string =>
  i.member && "displayName" in i.member ? i.member.displayName : i.user.displayName;
