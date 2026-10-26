import { expect, test } from "bun:test";
import { DiscordAPIError, PermissionFlagsBits, RESTJSONErrorCodes } from "discord.js";
import { BOT_CHANNEL_PERMISSIONS } from "../../../src/modules/motorsport/channels/setup.ts";
import { followErrorText, pingDeleteIsHopeless } from "../../../src/modules/motorsport/errors.ts";

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

test("a ping that can't be deleted, ever, is given up on", () => {
  for (const code of [
    RESTJSONErrorCodes.UnknownChannel,
    RESTJSONErrorCodes.UnknownMessage,
    RESTJSONErrorCodes.MissingAccess,
    RESTJSONErrorCodes.MissingPermissions,
  ]) {
    expect(pingDeleteIsHopeless(apiError(code))).toBe(true);
  }

  expect(pingDeleteIsHopeless(apiError(RESTJSONErrorCodes.InvalidFormBodyOrContentType))).toBe(
    false,
  );
  expect(pingDeleteIsHopeless(new Error("network"))).toBe(false);
});
