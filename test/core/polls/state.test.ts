import { expect, test } from "bun:test";
import { pollState } from "../../../src/core/polls/state.ts";

test("the poll state from a fetched message", () => {
  const message = {
    poll: {
      answers: [
        { answer_id: 1, poll_media: { text: "Yes" } },
        { answer_id: 2, poll_media: { text: "No" } },
      ],
      results: { is_finalized: true, answer_counts: [{ id: 1, count: 3, me_voted: false }] },
    },
  };

  expect(pollState(message)).toEqual({
    finalized: true,
    answers: [
      { id: 1, text: "Yes", count: 3 },
      { id: 2, text: "No", count: null },
    ],
  });
  expect(pollState({ content: "no poll" })).toBeNull();
});
