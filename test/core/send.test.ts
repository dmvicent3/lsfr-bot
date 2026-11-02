import { describe, expect, spyOn, test } from "bun:test";
import {
  type Client,
  DiscordAPIError,
  type MessageComponentInteraction,
  RESTJSONErrorCodes,
} from "discord.js";
import { log } from "../../src/core/log.ts";
import { outgoing, postOrLog, sendFailure, sendTo } from "../../src/core/send.ts";

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

describe("sendTo", () => {
  test("logs a failed send under the caller's scope", async () => {
    const channel = {
      isSendable: () => true,
      send: () => Promise.reject(new Error("boom")),
    };
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- a stand-in for the one call sendTo makes
    const client = { channels: { fetch: async () => channel } } as unknown as Client;
    const error = spyOn(log, "error").mockImplementation(() => {});

    expect(await sendTo(client, "c1", { content: "x" }, "rss:post")).toEqual({ result: "failed" });
    expect(error.mock.calls[0]?.[0]).toBe("rss:post");

    error.mockRestore();
  });
});

const click = (channel: unknown) =>
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- a stand-in for the channel read
  ({ channel }) as unknown as MessageComponentInteraction;

describe("postOrLog", () => {
  test("posts the content pinging no one", async () => {
    const sent: unknown[] = [];
    await postOrLog(click({ send: async (m: unknown) => void sent.push(m) }), "t", "failed", "hi");

    expect(sent).toEqual([{ content: "hi", allowedMentions: { parse: [] } }]);
  });

  test("a missing channel is logged, not thrown", async () => {
    const err = spyOn(log, "error").mockImplementation(() => {});
    await postOrLog(click(null), "t", "could not post", "hi");

    expect(err).toHaveBeenCalledWith("t", "could not post: no channel to send to");
    err.mockRestore();
  });

  test("a failing send is logged, not thrown", async () => {
    const err = spyOn(log, "error").mockImplementation(() => {});
    const boom = new Error("no permission");
    await postOrLog(click({ send: async () => Promise.reject(boom) }), "t", "could not post", "hi");

    expect(err).toHaveBeenCalledWith("t", "could not post", boom);
    err.mockRestore();
  });
});
