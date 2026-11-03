import { expect, test } from "bun:test";
import { messageUrl, pollBody, pollEnd } from "../../../../src/modules/feedback/script/body.ts";

test("the poll body is Discord's poll create shape", () => {
  expect(pollBody({ question: "Q?", options: ["A", "B"], hours: 48, multi: true })).toEqual({
    poll: {
      question: { text: "Q?" },
      answers: [{ poll_media: { text: "A" } }, { poll_media: { text: "B" } }],
      duration: 48,
      allow_multiselect: true,
    },
    allowed_mentions: { parse: [] },
  });
});

test("the end is Discord's expiry, else the hours from now", () => {
  const expiry = "2026-11-05T10:00:00.000+00:00";

  expect(pollEnd({ poll: { expiry } }, 0, 24)).toBe(Date.parse(expiry));
  expect(pollEnd({ poll: { expiry: null } }, 1000, 2)).toBe(1000 + 7_200_000);
  expect(pollEnd(null, 1000, 1)).toBe(1000 + 3_600_000);
});

test("message links", () => {
  expect(messageUrl("g", "c", "m")).toBe("https://discord.com/channels/g/c/m");
});
