import { describe, expect, test } from "bun:test";
import { channel } from "../../../../src/modules/manga/commands/channel.ts";
import { mangaChannel } from "../../../../src/modules/manga/settings.ts";
import { fakeCommand } from "./fake.ts";

describe("/manga channel", () => {
  test("sets the channel for members who can manage the server", async () => {
    const { ctx, replies } = fakeCommand({ channelId: "c9", manageServer: true });
    await channel(ctx);
    expect(replies).toEqual(["Manga chapters will be posted in <#c9>."]);
    expect(mangaChannel(ctx.db)).toBe("c9");
  });

  test("refuses everyone else", async () => {
    const { ctx, replies } = fakeCommand({ channelId: "c9" });
    await channel(ctx);
    expect(replies).toEqual(["Only members with Manage Server can set the manga channel."]);
    expect(mangaChannel(ctx.db)).toBeNull();
  });
});
