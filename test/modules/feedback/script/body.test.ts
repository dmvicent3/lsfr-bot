import { expect, test } from "bun:test";
import { messageUrl } from "../../../../src/modules/feedback/script/body.ts";

test("message links", () => {
  expect(messageUrl("g", "c", "m")).toBe("https://discord.com/channels/g/c/m");
});
