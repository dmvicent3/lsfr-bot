import { describe, expect, test } from "bun:test";
import { postPoll, readPoll, voteCounts } from "../../../src/core/polls/post.ts";
import { fakeRest } from "./fake-rest.ts";

const REQ = { question: "Q?", options: ["A", "B"], hours: 5, multi: false };

describe("postPoll", () => {
  test("posts to the channel and returns the message id and end", () => {
    const expiry = "2026-11-09T00:00:00.000+00:00";
    const { rest, calls } = fakeRest({}, { id: "m1", poll: { expiry } });

    expect(postPoll(rest, "c1", REQ, 0)).resolves.toEqual({
      messageId: "m1",
      endsAt: Date.parse(expiry),
    });
    expect(calls[0]).toMatchObject({ method: "post", route: "/channels/c1/messages" });
  });

  test("null without a message id", async () => {
    expect(await postPoll(fakeRest({}, {}).rest, "c1", REQ, 0)).toBeNull();
  });
});

describe("readPoll and voteCounts", () => {
  test("reads the message's poll and counts votes in answer order", async () => {
    const message = {
      poll: {
        answers: [
          { answer_id: 2, poll_media: { text: "B" } },
          { answer_id: 1, poll_media: { text: "A" } },
        ],
        results: { is_finalized: false, answer_counts: [{ id: 2, count: 4 }] },
      },
    };
    const { rest } = fakeRest({ "/channels/c1/messages/m1": () => message });
    const state = await readPoll(rest, "c1", "m1");

    expect(state && voteCounts(state)).toEqual([0, 4]);
  });
});
