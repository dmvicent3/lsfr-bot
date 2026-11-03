import { describe, expect, test } from "bun:test";
import { runScript } from "../../../../src/modules/feedback/script/run.ts";
import type { Rest } from "../../../../src/modules/feedback/script/types.ts";
import { setPollChannel } from "../../../../src/modules/feedback/settings.ts";
import { newEntry, setup } from "../setup.ts";
import { fakeRest } from "./fake-rest.ts";

const page = (from: number, n: number) =>
  Array.from({ length: n }, (_, k) => ({ id: String(from + k), username: `v${from + k}` }));
const NOW = Date.parse("2026-11-03T12:00:00.000Z");

function deps(rest: Rest) {
  const s = setup();

  return { ...s, d: { db: s.db, repo: s.repo, rest, now: NOW } };
}

describe("list and read", () => {
  test("list shows unread entries with names; read hides them", async () => {
    const { rest } = fakeRest({ "/users/u1": () => ({ username: "alice", global_name: null }) });
    const { repo, d } = deps(rest);
    const id = repo.entries.add(newEntry({ now: 0 }));
    repo.entries.add(newEntry({ userId: "u9", now: 0, text: "Hi there all" }));

    const listed = await runScript(["list"], d);
    expect(listed.ok).toBe(true);
    expect(listed.text).toBe(
      "#1 [crossword] alice 1970-01-01T00:00:00.000Z\n    The clues are too hard\n\n" +
        "#2 [crossword] u9 1970-01-01T00:00:00.000Z\n    Hi there all",
    );

    expect(await runScript(["read", String(id)], d)).toEqual({ ok: true, text: "Marked 1 read." });
    expect((await runScript(["list"], d)).text).not.toContain("#1 ");
    expect((await runScript(["list", "--all"], d)).text).toContain("#1 ");
  });

  test("a bad command line is an error with the reason", async () => {
    const { d } = deps(fakeRest({}).rest);

    expect(await runScript(["read"], d)).toEqual({
      ok: false,
      text: "read needs entry ids or --all.",
    });
  });
});

describe("poll", () => {
  const question = ["poll", "Bigger grids?", "--option", "Yes", "--option", "No"];

  test("posts the poll in the server's channel and stores it", async () => {
    const expiry = "2026-11-04T12:00:00.000+00:00";
    const { rest, calls } = fakeRest({}, { id: "m7", channel_id: "c1", poll: { expiry } });
    const { db, repo, d } = deps(rest);
    setPollChannel(db, "g1", "c1");

    const out = await runScript(question, d);

    expect(out).toEqual({
      ok: true,
      text: "poll #1 posted: https://discord.com/channels/g1/c1/m7",
    });
    expect(calls[0]).toMatchObject({ method: "post", route: "/channels/c1/messages" });
    expect(calls[0]?.body).toMatchObject({ poll: { duration: 24, allow_multiselect: false } });
    expect(repo.polls.get(1)).toMatchObject({
      guildId: "g1",
      messageId: "m7",
      options: ["Yes", "No"],
      endsAt: Date.parse(expiry),
    });
  });

  test("no channel, several channels, --guild", async () => {
    const { rest, calls } = fakeRest({}, { id: "m7" });
    const { db, d } = deps(rest);

    expect((await runScript(question, d)).text).toBe(
      "No server has a poll channel; set one with /feedback settings.",
    );

    setPollChannel(db, "g1", "c1");
    setPollChannel(db, "g2", "c2");
    expect((await runScript(question, d)).text).toBe(
      "Several servers have a poll channel (g1, g2); pass --guild <id>.",
    );
    expect((await runScript([...question, "--guild", "g3"], d)).ok).toBe(false);
    expect(calls).toEqual([]);

    expect((await runScript([...question, "--guild", "g2"], d)).ok).toBe(true);
    expect(calls[0]?.route).toBe("/channels/c2/messages");
  });
});

function withPoll(rest: Rest) {
  const s = deps(rest);
  s.repo.polls.add({
    guildId: "g",
    channelId: "c",
    messageId: "m",
    question: "Bigger grids?",
    options: ["Yes", "No"],
    multi: false,
    createdAt: NOW - 10,
    endsAt: NOW + 3_600_000,
  });

  return s;
}

describe("polls and results", () => {
  test("polls lists them", async () => {
    const { d } = withPoll(fakeRest({}).rest);

    expect((await runScript(["polls"], d)).text).toBe(
      "#1 Bigger grids? · ends 2026-11-03T13:00:00.000Z · open",
    );
  });

  test("results pages through the voters of each answer", async () => {
    const { rest, calls } = fakeRest({
      "/channels/c/messages/m": () => ({
        poll: {
          answers: [
            { answer_id: 1, poll_media: { text: "Yes" } },
            { answer_id: 2, poll_media: { text: "No" } },
          ],
          results: { is_finalized: false, answer_counts: [{ id: 1, count: 101 }] },
        },
      }),
      "/channels/c/polls/m/answers/1": (q) => ({
        users: q.get("after") === "100" ? page(101, 1) : page(1, 100),
      }),
      "/channels/c/polls/m/answers/2": () => ({ users: [] }),
    });
    const { d } = withPoll(rest);

    const out = await runScript(["results", "1"], d);

    expect(out.ok).toBe(true);
    expect(out.text.split("\n").slice(0, 2)).toEqual([
      "poll #1: Bigger grids?",
      "not finalised (ends 2026-11-03T13:00:00.000Z)",
    ]);
    expect(out.text).toContain("1. Yes: 101 votes (v1, v2,");
    expect(out.text).toContain("v100, v101)");
    expect(out.text).toEndWith("2. No: 0 votes");
    expect(calls.map((c) => c.query)).toEqual([
      "",
      "limit=100",
      "limit=100&after=100",
      "limit=100",
    ]);
  });

  test("an unknown poll", async () => {
    const { d } = deps(fakeRest({}).rest);

    expect(await runScript(["results", "9"], d)).toEqual({ ok: false, text: "No poll #9." });
  });
});
