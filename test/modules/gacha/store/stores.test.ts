import { describe, expect, test } from "bun:test";
import { ME, setup } from "../testing/setup.ts";

const banner = (week: string, five: string) => ({
  guildId: "g",
  week,
  featured: { five, fours: [`${five}-a`, `${five}-b`, `${five}-c`] },
  voted: { five: true, fours: false },
  startedAt: 1,
});

describe("BannerStore", () => {
  test("one banner per week; later adds are ignored", () => {
    const { repo } = setup();

    expect(repo.banners.add(banner("2026-11-02", "x"))).toBe(true);
    expect(repo.banners.add(banner("2026-11-02", "y"))).toBe(false);
    expect(repo.banners.get("g", "2026-11-02")).toEqual(banner("2026-11-02", "x"));
    expect(repo.banners.get("g", "2026-11-09")).toBeNull();
  });

  test("before: the n banners before a week, newest first", () => {
    const { repo } = setup();

    for (const [w, f] of [
      ["2026-10-12", "a"],
      ["2026-10-19", "b"],
      ["2026-10-26", "c"],
      ["2026-11-02", "d"],
    ] as const) {
      repo.banners.add(banner(w, f));
    }

    expect(repo.banners.before("g", "2026-11-02", 2).map((f) => f.five)).toEqual(["c", "b"]);
  });
});

describe("PollStore", () => {
  test("one poll per kind per week, failed posts kept without a message", () => {
    const { repo } = setup();
    const poll = {
      guildId: "g",
      week: "2026-11-09",
      kind: "five" as const,
      channelId: "c",
      messageId: null,
      options: ["a", "b"],
      endsAt: 9,
    };

    expect(repo.polls.add(poll)).toBe(true);
    expect(repo.polls.add({ ...poll, messageId: "m" })).toBe(false);
    expect(repo.polls.forWeek("g", "2026-11-09")).toEqual({ five: poll });
  });
});

const land = (tier: 5 | 3, featured: boolean) => ({
  driverId: "x",
  tier,
  featured,
  lost: !featured,
  guaranteed: false,
  pulls: 1,
  level: 0,
  isNew: true,
  refund: 0,
});

describe("PullStore", () => {
  test("limitedFives: only limited ★5s, oldest first, featured or not", () => {
    const { repo } = setup();
    repo.pulls.add(ME, {
      banner: "limited",
      landed: [land(5, true), land(3, false)],
      price: 1,
      now: 1,
    });
    repo.pulls.add(ME, { banner: "standard", landed: [land(5, false)], price: 1, now: 2 });
    repo.pulls.add(ME, { banner: "limited", landed: [land(5, false)], price: 1, now: 3 });

    expect(repo.pulls.limitedFives(ME)).toEqual([true, false]);
  });

  test("history newest first, paged", () => {
    const { repo } = setup();
    const landed = ["a", "b", "c"].map((driverId) => ({
      driverId,
      tier: 3 as const,
      featured: false,
      lost: false,
      guaranteed: false,
      pulls: 1,
      level: 0,
      isNew: true,
      refund: 0,
    }));
    repo.pulls.add(ME, { banner: "standard", landed, price: 10, now: 4 });

    expect(repo.pulls.recent(ME, { limit: 2, offset: 0 }).map((p) => p.driverId)).toEqual([
      "c",
      "b",
    ]);
    expect(repo.pulls.recent(ME, { limit: 2, offset: 2 })[0]).toMatchObject({
      driverId: "a",
      banner: "standard",
      tier: 3,
      cost: 10,
      at: 4,
    });
  });
});
