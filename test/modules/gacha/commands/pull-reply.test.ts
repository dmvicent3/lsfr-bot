import { describe, expect, test } from "bun:test";
import { pullMessages } from "../../../../src/modules/gacha/commands/pull-reply.ts";
import { rosterOf } from "../../../../src/modules/gacha/data/roster.ts";
import type { Landed } from "../../../../src/modules/gacha/engine/types.ts";
import { driver } from "../testing/drivers.ts";

const ROSTER = rosterOf([
  driver({ id: "c", name: "Cham Pion", family: "Pion", tier: 5, titles: 2 }),
  driver({ id: "w", name: "Win Ner", family: "Ner", tier: 4, wins: 3 }),
  driver({ id: "t", name: "Tail Ender", family: "Ender" }),
]);
const PITY = { five: 0, four: 0, guaranteeFive: false, guaranteeFour: false };
const land = (driverId: string, tier: Landed["tier"]): Landed => ({
  driverId,
  tier,
  featured: false,
  lost: false,
  level: 0,
  isNew: true,
  refund: 0,
});

describe("pullMessages", () => {
  test("a 10-pull: one grid image, rarest listed first, one public post per ★5", () => {
    const landed = [
      land("t", 3),
      land("w", 4),
      land("c", 5),
      ...Array.from({ length: 6 }, () => land("t", 3)),
      land("c", 5),
    ];
    const { reply, news } = pullMessages({
      roster: ROSTER,
      userId: "u",
      kind: "limited",
      out: { landed, pity: PITY, balance: 10, cost: 1400 },
    });

    expect(reply.files).toHaveLength(1);
    expect(String(reply.content).split("\n")[1]).toContain("Cham Pion");
    expect(news).toHaveLength(2);
    expect(news[0]?.content).toContain("<@u> pulled ★5 Cham Pion");
    expect(news[0]?.allowedMentions).toEqual({ parse: [] });
  });

  test("an unknown driver id is an error, not a blank card", () => {
    expect(() =>
      pullMessages({
        roster: ROSTER,
        userId: "u",
        kind: "standard",
        out: { landed: [land("gone", 3)], pity: PITY, balance: 0, cost: 1 },
      }),
    ).toThrow();
  });
});
