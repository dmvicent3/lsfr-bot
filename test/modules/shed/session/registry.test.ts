import { expect, test } from "bun:test";
import {
  playingElsewhere,
  register,
  unregister,
} from "../../../../src/modules/shed/session/registry.ts";
import { setup } from "./fixtures.ts";

test("playingElsewhere: seated in a live game of the same server, in another channel", async () => {
  const { runner } = await setup();
  register("c", runner);
  expect(playingElsewhere("g", "u2", "other")).toBe(true);
  expect(playingElsewhere("g", "u2", "c")).toBe(false);
  expect(playingElsewhere("h", "u2", "other")).toBe(false);
  expect(playingElsewhere("g", "u9", "other")).toBe(false);
  unregister("c", runner);
  expect(playingElsewhere("g", "u2", "other")).toBe(false);
});
