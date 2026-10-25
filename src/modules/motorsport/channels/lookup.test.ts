import { expect, test } from "bun:test";
import { ChannelType } from "discord.js";
import { isSeriesChannelType } from "./lookup.ts";

test("text and announcement channels count as the series channel", () => {
  expect(isSeriesChannelType(ChannelType.GuildText)).toBe(true);
  expect(isSeriesChannelType(ChannelType.GuildAnnouncement)).toBe(true);
  expect(isSeriesChannelType(ChannelType.GuildVoice)).toBe(false);
  expect(isSeriesChannelType(ChannelType.GuildForum)).toBe(false);
});
