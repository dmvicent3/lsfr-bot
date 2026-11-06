import { describe, expect, test } from "bun:test";
import { setSetting } from "../../../../src/core/settings.ts";
import { lcg } from "../../../../src/core/random.ts";
import { rosterOf } from "../../../../src/modules/gacha/data/roster.ts";
import { ensureBanner } from "../../../../src/modules/gacha/weekly/ensure.ts";
import { postPollsIfDue } from "../../../../src/modules/gacha/weekly/polls.ts";
import type { WeeklyDeps } from "../../../../src/modules/gacha/weekly/types.ts";
import { fakeRest } from "../../../core/polls/fake-rest.ts";
import { driver } from "../testing/drivers.ts";
import { setup } from "../testing/setup.ts";

const ROSTER = rosterOf([
  ...Array.from({ length: 8 }, (_, n) =>
    driver({ id: `c${n}`, name: `Cham P${n}`, family: `P${n}`, tier: 5, titles: 1 }),
  ),
  ...Array.from({ length: 20 }, (_, n) =>
    driver({ id: `w${n}`, name: `Win R${n}`, family: `R${n}`, tier: 4, wins: 2 }),
  ),
  driver({ id: "x" }),
]);
// Friday 6 Nov 2026 15:00 in Lisbon (UTC in winter); its week started Monday 2 Nov.
const FRIDAY = Date.parse("2026-11-06T15:00:00Z");
const NEXT_MONDAY = Date.parse("2026-11-09T00:02:00Z");

const pollMessage = (counts: { id: number; count: number }[], n: number) => ({
  poll: {
    answers: Array.from({ length: n }, (_, k) => ({ answer_id: k + 1, poll_media: { text: "x" } })),
    results: { is_finalized: true, answer_counts: counts },
  },
});

function deps(over: Partial<WeeklyDeps> = {}) {
  const s = setup();
  const sent: { channelId: string; content: unknown }[] = [];
  const d: WeeklyDeps = {
    repo: s.repo,
    roster: ROSTER,
    rest: fakeRest({}).rest,
    send: async (channelId, message) => {
      sent.push({ channelId, content: message.content });

      return { result: "ok", messageId: "m" };
    },
    now: FRIDAY,
    random: lcg(42),
    ...over,
  };

  return { d, sent, s };
}

describe("ensureBanner", () => {
  test("the first banner is random, stored once, and announced when a channel is set", async () => {
    const { d, sent, s } = deps();
    setSetting(s.db, "gacha.channel.g", "chan");
    const first = await ensureBanner(d, "g");

    expect(first.week).toBe("2026-11-02");
    expect(first.voted).toEqual({ five: false, fours: false });
    expect(ROSTER.pools[5]).toContain(first.featured.five);
    expect(first.featured.fours).toHaveLength(3);
    expect(await ensureBanner({ ...d, random: lcg(7) }, "g")).toEqual(first);
    expect(sent).toHaveLength(1);
    expect(sent[0]?.channelId).toBe("chan");
  });

  test("without a channel the banner starts quietly", async () => {
    const { d, sent } = deps();
    await ensureBanner(d, "g");

    expect(sent).toHaveLength(0);
  });
});

describe("weekly polls", () => {
  test("not before Thursday noon, and not without a channel", async () => {
    const { d, s } = deps({ now: Date.parse("2026-11-05T11:00:00Z") });
    setSetting(s.db, "gacha.channel.g", "chan");
    await postPollsIfDue(d, "g");
    await postPollsIfDue({ ...d, now: FRIDAY }, "other-guild");

    expect(s.repo.polls.forWeek("g", "2026-11-09")).toEqual({});
  });

  test("posts both polls once; Monday's banner takes the winners", async () => {
    const { s } = deps();
    setSetting(s.db, "gacha.channel.g", "chan");
    const posted = fakeRest({}, { id: "pm", poll: { expiry: "2026-11-08T23:00:00.000Z" } });
    const { d } = { d: { ...deps().d, repo: s.repo, rest: posted.rest } };
    await ensureBanner(d, "g");
    await postPollsIfDue(d, "g");
    await postPollsIfDue(d, "g");
    const polls = s.repo.polls.forWeek("g", "2026-11-09");

    expect(posted.calls.filter((c) => c.method === "post")).toHaveLength(2);
    expect(polls.five?.options).toHaveLength(4);
    expect(polls.fours?.options).toHaveLength(8);
    expect(polls.five?.endsAt).toBe(Date.parse("2026-11-08T23:00:00.000Z"));

    const current = s.repo.banners.get("g", "2026-11-02");

    expect(polls.five?.options).not.toContain(current?.featured.five);

    const fiveVotes = [
      { id: 3, count: 5 },
      { id: 1, count: 2 },
    ];
    const fourVotes = [
      { id: 8, count: 9 },
      { id: 2, count: 7 },
      { id: 5, count: 6 },
      { id: 1, count: 1 },
    ];
    let reads = 0;
    const read = fakeRest({
      "/channels/chan/messages/pm": () =>
        reads++ === 0 ? pollMessage(fiveVotes, 4) : pollMessage(fourVotes, 8),
    });
    const monday = await ensureBanner({ ...d, rest: read.rest, now: NEXT_MONDAY }, "g");
    const five = polls.five?.options ?? [];
    const fours = polls.fours?.options ?? [];

    expect(monday.week).toBe("2026-11-09");
    expect(monday.voted).toEqual({ five: true, fours: true });
    expect(monday.featured.five).toBe(String(five[2]));
    expect(monday.featured.fours).toEqual([7, 1, 4].map((k) => String(fours[k])));
  });

  test("a failed post is kept without a message and next week is random", async () => {
    const { s } = deps();
    setSetting(s.db, "gacha.channel.g", "chan");
    const failing = {
      get: async () => null,
      post: async () => Promise.reject(new Error("Missing Permissions")),
    };
    const d = { ...deps().d, repo: s.repo, rest: failing };
    await postPollsIfDue(d, "g");

    expect(s.repo.polls.forWeek("g", "2026-11-09").five?.messageId).toBeNull();

    const monday = await ensureBanner({ ...d, now: NEXT_MONDAY }, "g");

    expect(monday.voted).toEqual({ five: false, fours: false });
  });
});
