import { expect, test } from "bun:test";
import { postBody } from "../../../src/modules/feedback/message.ts";
import { access, postText } from "../../../src/modules/feedback/text.ts";
import type { Entry } from "../../../src/modules/feedback/types.ts";

const entry = (over: Partial<Entry> = {}): Entry => ({
  id: 7,
  guildId: "g",
  userId: "u1",
  topic: "crossword",
  text: "More clues please",
  channelId: null,
  messageId: null,
  createdAt: 1,
  editedAt: null,
  removedAt: null,
  readAt: null,
  ...over,
});

test("the post names the topic and author, then the text", () => {
  expect(postText(entry())).toBe("💬 **Feedback · crossword** from <@u1>\nMore clues please");
});

test("an edited post is marked", () => {
  expect(postText(entry({ editedAt: 5 }))).toBe(
    "💬 **Feedback · crossword** from <@u1>\nMore clues please\n*(edited)*",
  );
});

test("the body pings no one and carries Edit and Remove for the entry", () => {
  const body = postBody(entry({ text: "@everyone look" }));

  expect(body.allowedMentions).toEqual({ parse: [] });
  expect(body.components[0]?.components.map((b) => [b.custom_id, b.label])).toEqual([
    ["feedback:edit:7", "Edit"],
    ["feedback:remove:7", "Remove"],
  ]);
});

test("only the author may change a live entry", () => {
  expect(access(entry(), "u1")).toBe("ok");
  expect(access(entry(), "u2")).toBe("not-author");
  expect(access(entry({ removedAt: 3 }), "u1")).toBe("gone");
  expect(access(null, "u1")).toBe("gone");
});
