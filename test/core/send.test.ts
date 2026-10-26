import { describe, expect, test } from "bun:test";
import { DiscordAPIError, RESTJSONErrorCodes } from "discord.js";
import { outgoing, sendFailure } from "../../src/core/send.ts";

function apiError(code: number): DiscordAPIError {
  return new DiscordAPIError({ code, message: "x" }, code, 403, "POST", "/channels/1/messages", {});
}

describe("sendFailure", () => {
  test("a gone channel or server is lost; missing permissions is a retryable failure", () => {
    expect(sendFailure(apiError(RESTJSONErrorCodes.UnknownChannel))).toBe("lost-channel");
    expect(sendFailure(apiError(RESTJSONErrorCodes.MissingAccess))).toBe("lost-channel");
    expect(sendFailure(apiError(RESTJSONErrorCodes.UnknownGuild))).toBe("lost-channel");
    expect(sendFailure(apiError(RESTJSONErrorCodes.MissingPermissions))).toBe("failed");
    expect(sendFailure(new Error("boom"))).toBe("failed");
  });
});

describe("outgoing", () => {
  test("never pings anyone", () => {
    expect(outgoing({ content: "@everyone" })).toEqual({
      content: "@everyone",
      allowedMentions: { parse: [] },
    });
  });

  test("outgoing allows exactly the given mentions", () => {
    expect(outgoing({ content: "x" }, { users: ["1"] })).toEqual({
      content: "x",
      allowedMentions: { users: ["1"] },
    });
  });
});
