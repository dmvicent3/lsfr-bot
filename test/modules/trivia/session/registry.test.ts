import { expect, test } from "bun:test";
import { register, runnerIn, unregister } from "../../../../src/modules/trivia/session/registry.ts";
import { Runner } from "../../../../src/modules/trivia/session/runner.ts";
import { freshRepo } from "../fixtures.ts";

const runner = (sessionId: number): Runner =>
  new Runner(
    { sessionId, guildId: "g", channelId: "c", now: 0 },
    {
      repo: freshRepo(),
      poster: { post: async () => ({ result: "failed" }), edit: async () => false },
      random: Math.random,
      questions: [],
      lists: [],
      onEnd: () => undefined,
    },
  );

test("an old session ending does not drop the new one in its channel", () => {
  const old = runner(1);
  const fresh = runner(2);
  register("c", old);
  register("c", fresh);
  unregister("c", old);

  expect(runnerIn("c")).toBe(fresh);

  unregister("c", fresh);
  expect(runnerIn("c")).toBeUndefined();
});
