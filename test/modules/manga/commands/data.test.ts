import { describe, expect, test } from "bun:test";
import { ChannelType, InteractionContextType } from "discord.js";
import { data } from "../../../../src/modules/manga/commands/data.ts";

const sub = (name: string) => {
  const found = data.options?.find((o) => o.name === name);

  return found && "options" in found ? (found.options ?? []) : [];
};

describe("/manga data", () => {
  test("a guild-only command with four subcommands", () => {
    expect(data.name).toBe("manga");
    expect(data.contexts).toEqual([InteractionContextType.Guild]);
    expect(data.options?.map((o) => o.name)).toEqual(["follow", "unfollow", "list", "channel"]);
  });

  test("titles autocomplete; channel takes text and announcement channels", () => {
    expect(sub("follow")[0]).toMatchObject({ name: "title", required: true, autocomplete: true });
    expect(sub("unfollow")[0]).toMatchObject({ name: "title", required: true, autocomplete: true });
    expect(sub("channel")[0]).toMatchObject({
      name: "channel",
      required: true,
      channel_types: [ChannelType.GuildText, ChannelType.GuildAnnouncement],
    });
  });
});
