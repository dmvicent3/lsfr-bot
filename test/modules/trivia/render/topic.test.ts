import { expect, test } from "bun:test";
import { topicSelect } from "../../../../src/modules/trivia/render/topic.ts";

test("an open select lists the topics under the session's custom ID", () => {
  const [row] = topicSelect(7, ["History", "Sports"], { state: "open" });
  const select = row?.components[0];

  expect(select?.custom_id).toBe("trivia:topic:7");
  expect(select?.options.map((o) => o.value)).toEqual(["History", "Sports"]);
  expect(select?.disabled).toBe(false);
});

test("a chosen or timed-out select is disabled with its outcome", () => {
  const chosen = topicSelect(7, ["History"], { state: "chosen", topic: "History" })[0]
    ?.components[0];
  const timedOut = topicSelect(7, ["History"], { state: "timeout" })[0]?.components[0];

  expect(chosen?.disabled).toBe(true);
  expect(chosen?.placeholder).toBe("Next topic: History");
  expect(timedOut?.placeholder).toBe("No pick — random topic");
});
