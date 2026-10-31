import { expect, test } from "bun:test";
import * as replies from "../../../../src/modules/shed/components/replies.ts";

test("every result of every game function has a reply, none empty", () => {
  const maps = Object.entries(replies).filter(([, v]) => typeof v === "object");
  expect(maps.length).toBeGreaterThanOrEqual(10);

  for (const [name, map] of maps)
    for (const [key, text] of Object.entries(map))
      expect({ name, key, empty: text.trim() === "" }).toEqual({ name, key, empty: false });
});

test("the replies the plan pins", () => {
  expect(replies.PLAYS.illegal).toBe("That isn't legal on the top card.");
  expect(replies.PLAYS["not-your-turn"]).toBe("It's not your turn.");
  expect(replies.PLAYS.stale).toBe("That turn is over — here's your hand now.");
  expect(replies.PLAYS["no-stacking"]).toBe("Stacking is off in this game.");
  expect(replies.PLAYS["not-held"]).toBe("You don't have that many.");
  expect(replies.JOINS).toEqual({
    joined: "You're in.",
    already: "You're already in.",
    full: "The table is full (8).",
    started: "The game has started.",
    elsewhere: "You're in a game in another channel.",
  });
});
