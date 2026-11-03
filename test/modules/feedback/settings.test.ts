import { expect, test } from "bun:test";
import {
  pollChannel,
  pollChannels,
  setPollChannel,
} from "../../../src/modules/feedback/settings.ts";
import { setup } from "./setup.ts";

test("a poll channel per server", () => {
  const { db } = setup();
  expect(pollChannel(db, "g1")).toBeNull();
  expect(pollChannels(db)).toEqual([]);

  setPollChannel(db, "g1", "c1");
  setPollChannel(db, "g2", "c2");
  setPollChannel(db, "g1", "c3");

  expect(pollChannel(db, "g1")).toBe("c3");
  expect(pollChannels(db)).toEqual([
    { guildId: "g1", channelId: "c3" },
    { guildId: "g2", channelId: "c2" },
  ]);
});
