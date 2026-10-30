import { expect, test } from "bun:test";
import type { SendResult } from "../../../../src/core/types.ts";
import { Runner } from "../../../../src/modules/trivia/session/runner.ts";
import type { Outgoing, Poster } from "../../../../src/modules/trivia/session/types.ts";
import type { TriviaRepo } from "../../../../src/modules/trivia/store/repo.ts";
import type { KaosList, Question } from "../../../../src/modules/trivia/types.ts";
import { freshRepo, kaos, question, scripted } from "../fixtures.ts";

const T0 = Date.UTC(2026, 9, 30, 12);

class FakePoster implements Poster {
  posts: Outgoing[] = [];
  edits: { id: string; msg: Outgoing }[] = [];
  fail: SendResult | null = null;

  async post(msg: Outgoing): Promise<SendResult> {
    if (this.fail) return this.fail;

    this.posts.push(msg);

    return { result: "ok", messageId: `m${this.posts.length}` };
  }

  async edit(id: string, msg: Outgoing): Promise<boolean> {
    this.edits.push({ id, msg });

    return true;
  }
}

function setup(p: { questions?: Question[]; lists?: KaosList[]; random?: () => number } = {}) {
  const repo: TriviaRepo = freshRepo();
  const poster = new FakePoster();
  const sessionId =
    repo.sessions.start({ guildId: "g", channelId: "c", startedBy: "u", at: T0 }) ?? 0;
  let ended = 0;
  const runner = new Runner(
    { sessionId, guildId: "g", channelId: "c", now: T0 },
    {
      repo,
      poster,
      random: p.random ?? (() => 0.5),
      questions: p.questions ?? [question(1, { answer: "Paris" })],
      lists: p.lists ?? [kaos(1)],
      onEnd: () => ended++,
    },
  );

  return { repo, poster, runner, ended: () => ended };
}

const text = (m: Outgoing | undefined): string =>
  `${m?.content ?? ""}${JSON.stringify(m?.embeds ?? [])}`;

test("the first tick posts the first question and records it as asked", async () => {
  const { repo, poster, runner } = setup();
  await runner.tick(T0);

  expect(text(poster.posts[0])).toContain("#1 · General Knowledge · easy");
  expect(repo.asked.lastInChannel("c")).toEqual({ kind: "question", itemId: 1 });
});

test("a right typed answer posts the winner line and stores the points", async () => {
  const { repo, poster, runner } = setup();
  await runner.tick(T0);
  await runner.onMessage({ userId: "a", name: "Ana", text: "paris", at: T0 + 3_000 });

  expect(poster.posts.map(text).join("\n")).toContain("**Ana** got it!");
  expect(poster.posts.map(text).join("\n")).toContain("First answer on record: 3.00s");
  expect(repo.scores.standings("g", 0, T0 + 10_000)).toEqual([{ userId: "a", points: 10 }]);
});

test("three unanswered rounds end the session", async () => {
  const { repo, poster, runner, ended } = setup();

  for (let t = T0; t <= T0 + 200_000; t += 1_000) await runner.tick(t);

  expect(runner.ended).toBe(true);
  expect(ended()).toBe(1);
  expect(poster.posts.map(text).join("\n")).toContain("No one's playing — trivia stopped.");
  expect(
    repo.sessions.start({ guildId: "g", channelId: "c", startedBy: "u", at: T0 }),
  ).toBeNumber();
});

test("a lost channel ends the session without more posts", async () => {
  const { poster, runner, ended } = setup();
  poster.fail = { result: "lost-channel" };
  await runner.tick(T0);
  await runner.tick(T0 + 60_000);

  expect(runner.ended).toBe(true);
  expect(ended()).toBe(1);
  expect(poster.posts).toEqual([]);
});

test("the sole right picker chooses the next topic; the next round waits for it", async () => {
  const choices = [
    question(1, { kind: "choice", answer: "Mars", category: "Science" }),
    question(2, { kind: "choice", answer: "Rome", category: "History" }),
  ];
  const { poster, runner } = setup({ questions: choices, lists: [], random: () => 0 });
  await runner.tick(T0);
  const round = runner.state.round;

  if (round?.kind !== "button") throw new Error("expected a button round");

  const wrong = (round.right + 1) % round.options.length;
  await runner.onPick(round.id, { userId: "a", name: "Ana", index: round.right, at: T0 + 2_000 });
  await runner.onPick(round.id, { userId: "b", name: "Bo", index: wrong, at: T0 + 3_000 });
  await runner.tick(T0 + 20_000);
  const posted = poster.posts.length;

  expect(text(poster.posts.at(-1))).toContain("🎯 Ana was the only one right");
  expect(poster.posts.at(-1)?.components).toHaveLength(1);

  await runner.tick(T0 + 30_000);
  expect(poster.posts).toHaveLength(posted);

  expect(await runner.onTopic("b", "History")).toBe("not-yours");
  expect(await runner.onTopic("a", "History")).toBe("ok");
  await runner.tick(T0 + 31_000);

  expect(text(poster.posts.at(-1))).toContain("History");
  expect(text(poster.posts.at(-1))).toContain("Topic picked by Ana");
});

test("a topic not chosen in 15 s lapses to a random one", async () => {
  const choices = [question(1, { kind: "choice", answer: "Mars" })];
  const { poster, runner } = setup({ questions: choices, lists: [], random: () => 0 });
  await runner.tick(T0);
  const round = runner.state.round;

  if (round?.kind !== "button") throw new Error("expected a button round");

  await runner.onPick(round.id, { userId: "a", name: "Ana", index: round.right, at: T0 + 1_000 });
  await runner.onPick(round.id, {
    userId: "b",
    name: "Bo",
    index: (round.right + 1) % 4,
    at: T0 + 1_500,
  });
  await runner.tick(T0 + 20_000);
  await runner.tick(T0 + 35_000);

  expect(JSON.stringify(poster.edits.at(-1)?.msg)).toContain("No pick — random topic");
  expect(await runner.onTopic("a", "General Knowledge")).toBe("over");
});

test("picks on another round are answered as over", async () => {
  const { runner } = setup({ questions: [question(1, { kind: "choice" })] });
  await runner.tick(T0);

  expect(await runner.onPick("old", { userId: "a", name: "A", index: 0, at: T0 + 1 })).toEqual({
    result: "closed",
    index: null,
  });
});

test("a KAOS claim is posted at once and the embed catches up on the next tick", async () => {
  const { poster, runner } = setup({ random: () => 0.05 });
  await runner.tick(T0);
  await runner.onMessage({ userId: "a", name: "Ana", text: "two", at: T0 + 1_000 });

  expect(text(poster.posts.at(-1))).toBe("✔ Ana: two +10[]");

  await runner.tick(T0 + 2_000);
  expect(JSON.stringify(poster.edits.at(-1)?.msg)).toContain("two — Ana");
});

test("stop ends the session and posts the summary", async () => {
  const { poster, runner, ended } = setup();
  await runner.tick(T0);
  await runner.onMessage({ userId: "a", name: "Ana", text: "paris", at: T0 + 1_000 });
  await runner.stop(T0 + 2_000);

  expect(runner.ended).toBe(true);
  expect(ended()).toBe(1);
  expect(text(poster.posts.at(-1))).toContain("Top: 1. Ana 10");
});

test("a throw while announcing a close never awards the points twice", async () => {
  const { repo, poster, runner } = setup();
  await runner.tick(T0);
  const post = poster.post.bind(poster);
  let throws = 1;

  poster.post = async (msg) => {
    if (throws-- > 0) throw new Error("boom");

    return post(msg);
  };

  await runner
    .onMessage({ userId: "a", name: "Ana", text: "paris", at: T0 + 3_000 })
    .catch(() => undefined);
  await runner.tick(T0 + 4_000);
  await runner.tick(T0 + 5_000);

  expect(repo.scores.standings("g", 0, T0 + 10_000)).toEqual([{ userId: "a", points: 10 }]);
});

test("the click that closes a button round still learns its letter", async () => {
  const { runner } = setup({ questions: [question(1, { kind: "choice" })], lists: [] });
  await runner.tick(T0);
  await runner.onMessage({ userId: "a", name: "Ana", text: "hm", at: T0 + 500 });
  await runner.tick(T0 + 20_000);
  await runner.tick(T0 + 25_000);
  const round = runner.state.round;

  if (round?.kind !== "button") throw new Error("expected a button round");

  const picked = await runner.onPick(round.id, {
    userId: "a",
    name: "Ana",
    index: 2,
    at: T0 + 26_000,
  });

  expect(picked).toEqual({ result: "locked", index: 2 });
  expect(runner.state.round).toBeNull();
});

test("wrong guesses count as playing: no idle stop", async () => {
  const { runner } = setup();

  for (let t = T0; t <= T0 + 200_000; t += 1_000) {
    await runner.tick(t);
    await runner.onMessage({ userId: "b", name: "Bo", text: "london", at: t + 1 });
  }

  expect(runner.ended).toBe(false);
});

test("a button round waits for everyone active last round, not just its winner", async () => {
  const choice = question(2, { kind: "choice" });
  const typed = question(1, { answer: "Paris" });
  // Round 1: no KAOS, typed, first candidate, 3 hint shuffles; round 2: no KAOS, button.
  const random = scripted(0.5, 0.5, 0, 0, 0, 0, 0.5, 0.9);
  const { runner } = setup({ questions: [typed, choice], lists: [], random });
  await runner.tick(T0);
  await runner.onMessage({ userId: "b", name: "Bo", text: "london", at: T0 + 1_000 });
  await runner.onMessage({ userId: "a", name: "Ana", text: "paris", at: T0 + 2_000 });
  await runner.tick(T0 + 7_000);
  const round = runner.state.round;

  if (round?.kind !== "button") throw new Error("expected a button round");

  await runner.onPick(round.id, { userId: "a", name: "Ana", index: 0, at: T0 + 8_000 });

  expect(runner.state.round?.closedAt).toBeNull();
});
