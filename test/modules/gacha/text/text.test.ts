import { describe, expect, test } from "bun:test";
import { rosterOf } from "../../../../src/modules/gacha/data/roster.ts";
import { balanceText } from "../../../../src/modules/gacha/text/balance.ts";
import { pollStatus } from "../../../../src/modules/gacha/text/banner.ts";
import { collectionText } from "../../../../src/modules/gacha/text/collection.ts";
import { pityLine, record } from "../../../../src/modules/gacha/text/format.ts";
import { historyText } from "../../../../src/modules/gacha/text/history.ts";
import { pullText, shortText } from "../../../../src/modules/gacha/text/pull.ts";
import { driver } from "../testing/drivers.ts";

const SENNA = driver({
  id: "senna",
  name: "Ayrton Senna",
  family: "Senna",
  country: "BR",
  tier: 5,
  titles: 3,
  wins: 41,
  poles: 65,
});
const ROSTER = rosterOf([
  SENNA,
  driver({ id: "moss", name: "Stirling Moss", family: "Moss", tier: 4, wins: 16 }),
  driver({ id: "x" }),
]);
const FRESH = { five: 0, four: 0, guaranteeFive: false, guaranteeFour: false };

describe("format", () => {
  test("record leaves out zeros", () => {
    expect(record(SENNA)).toBe("3 titles · 41 wins · 65 poles");
    expect(record(driver({ id: "y", starts: 12 }))).toBe("12 starts");
  });

  test("the pity line shows guarantees only on the limited banner", () => {
    const p = { ...FRESH, five: 23, four: 3, guaranteeFive: true };

    expect(pityLine(p, true)).toBe(
      "★5 pity 23/90 · ★4 3/10 · next ★5 featured (guaranteed) · next ★4 is a 50/50",
    );
    expect(pityLine(p, false)).toBe("★5 pity 23/90 · ★4 3/10");
  });
});

describe("pullText", () => {
  test("lists each pull with its marks, then pity and balance", () => {
    const landed = {
      driverId: "senna",
      tier: 5 as const,
      featured: true,
      lost: false,
      level: 0,
      isNew: true,
      refund: 0,
    };
    const out = pullText({
      kind: "limited",
      shown: [{ landed, driver: SENNA }],
      pity: FRESH,
      cost: 140,
      balance: 1260,
    });

    expect(out).toContain("**1 pull · Limited banner** (−140)");
    expect(out).toContain("🇧🇷 **Ayrton Senna** · C0 · new · featured");
    expect(out).toContain("Balance: **1,260**");
  });

  test("short of currency says what it costs", () => {
    expect(shortText({ balance: 90, cost: 1400, price: 140 })).toContain(
      "costs 1,400 and your balance is 90",
    );
  });
});

describe("balanceText", () => {
  test("total, pulls it buys, the games it came from", () => {
    const out = balanceText({
      ledger: { earned: 2000, refunds: 70, spent: 280 },
      games: [
        { label: "Word", points: 1500 },
        { label: "Snake", points: 500 },
        { label: "Trivia", points: 0 },
      ],
      price: 140,
      limited: FRESH,
      standard: FRESH,
    });

    expect(out).toContain("**Balance: 1,790** · 12 pulls at 140");
    expect(out).toContain("Word 1,500 · Snake 500");
    expect(out).not.toContain("Trivia");
  });
});

describe("collectionText", () => {
  test("completion per tier and owned drivers by tier with levels", () => {
    const out = collectionText({
      name: "Ann",
      roster: ROSTER,
      copies: new Map([
        ["senna", 3],
        ["x", 1],
      ]),
      page: 1,
    });

    expect(out).toContain("★5 1/1 · ★4 0/1 · ★3 1/1");
    expect(out).toContain("**★5** 🇧🇷 Ayrton Senna C2");
  });

  test("nothing owned", () => {
    expect(collectionText({ name: "Ann", roster: ROSTER, copies: new Map(), page: 1 })).toContain(
      "No drivers yet",
    );
  });
});

describe("historyText", () => {
  test("rows newest first with relative times", () => {
    const row = {
      id: 1,
      banner: "limited" as const,
      driverId: "senna",
      tier: 5 as const,
      featured: true,
      level: 0,
      cost: 140,
      refund: 0,
      at: 1_700_000_000_000,
    };
    const out = historyText({ rows: [row], roster: ROSTER, page: 1, total: 1 });

    expect(out).toContain("★★★★★ **Ayrton Senna** · limited · C0 · featured · <t:1700000000:R>");
  });
});

describe("pollStatus", () => {
  const week = { start: "2026-11-02", startsAt: 0, endsAt: 7e8, pollsAt: 2e8 };

  test("before Thursday, without a channel, after a failed post, and once posted", () => {
    expect(pollStatus({ polls: [], channelId: "c", week })).toContain("open <t:200000:F>");
    expect(pollStatus({ polls: [], channelId: null, week })).toContain("No gacha channel");

    const poll = {
      guildId: "g",
      week: "2026-11-09",
      kind: "five" as const,
      channelId: "c",
      messageId: null,
      options: [],
      endsAt: 5e8,
    };

    expect(pollStatus({ polls: [poll], channelId: "c", week })).toContain("couldn't be posted");
    expect(pollStatus({ polls: [{ ...poll, messageId: "m" }], channelId: "c", week })).toContain(
      "<#c>",
    );
  });
});
