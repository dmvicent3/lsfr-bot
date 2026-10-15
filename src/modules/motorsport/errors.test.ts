import { expect, test } from "bun:test";
import { DiscordAPIError, PermissionFlagsBits, RESTJSONErrorCodes } from "discord.js";
import { BOT_CHANNEL_PERMISSIONS } from "./channels.ts";
import { followErrorText } from "./errors.ts";

function apiError(code: number): DiscordAPIError {
  return new DiscordAPIError({ code, message: "x" }, code, 403, "POST", "/x", {
    body: undefined,
    files: undefined,
  });
}

test("missing permissions get a readable cause", () => {
  expect(followErrorText(apiError(RESTJSONErrorCodes.MissingPermissions))).toBe(
    "Couldn't set up the channel: the bot is missing Manage Channels, Manage Roles or Pin Messages.",
  );
});

test("other errors keep their message", () => {
  expect(followErrorText(new Error("boom"))).toBe("Couldn't set up the channel: boom");
});

test("the bot can pin in its series channels", () => {
  expect(BOT_CHANNEL_PERMISSIONS).toContain(PermissionFlagsBits.PinMessages);
});
