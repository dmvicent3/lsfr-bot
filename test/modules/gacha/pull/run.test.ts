import { describe, expect, test } from "bun:test";
import { lcg } from "../../../../src/core/random.ts";
import { runPull } from "../../../../src/modules/gacha/pull/run.ts";
import { ledgerOf } from "../../../../src/modules/gacha/pull/ledger.ts";
import type { PullAsk } from "../../../../src/modules/gacha/pull/types.ts";
import { ME, POOLS, setup } from "../testing/setup.ts";
import { seq } from "../testing/seq.ts";

const ASK: PullAsk = {
  who: ME,
  kind: "limited",
  count: 10,
  price: 100,
  featured: { five: "f1", fours: ["q1", "q2", "q3"] },
  now: 5,
};

describe("runPull", () => {
  test("a 10-pull spends ten prices and stores rolls, counters and copies", () => {
    const s = setup();
    const out = runPull({ ...s, pools: POOLS, random: lcg(7) }, ASK);

    expect(out.ok).toBe(true);
    expect(out.cost).toBe(1000);
    expect(out.balance).toBe(0);
    expect(s.repo.pulls.count(ME)).toBe(10);
    expect(ledgerOf(s, ME)).toEqual({ earned: 1000, spent: 1000, refunds: 0 });

    if (!out.ok) return;

    expect(s.repo.pity.get(ME, "limited")).toEqual(out.pity);
    expect(out.landed.some((l) => l.tier >= 4)).toBe(true);
    const copies = [...s.repo.owned.all(ME).values()];

    expect(copies.reduce((a, b) => a + b, 0)).toBe(10);
  });

  test("short of the price: nothing is spent or rolled", () => {
    const s = setup(new Map([["u", 999]]));
    const out = runPull({ ...s, pools: POOLS, random: lcg(7) }, ASK);

    expect(out).toEqual({ ok: false, balance: 999, cost: 1000 });
    expect(s.repo.pulls.count(ME)).toBe(0);
    expect(s.repo.owned.all(ME).size).toBe(0);
  });

  test("a second pull can't spend what the first already spent", () => {
    const s = setup(new Map([["u", 150]]));
    const deps = { ...s, pools: POOLS, random: lcg(1) };
    const one = { ...ASK, count: 1 };

    expect(runPull(deps, one).ok).toBe(true);
    expect(runPull(deps, one)).toEqual({ ok: false, balance: 50, cost: 100 });
  });

  test("a copy past C6 refunds, and the refund counts in the balance", () => {
    const s = setup(new Map([["u", 100]]));
    s.repo.owned.save(ME, new Map([["t1", 7]]), 1);
    // ★3 (0.5), then t1 (pool index 0).
    const out = runPull({ ...s, pools: POOLS, random: seq(0.5, 0) }, { ...ASK, count: 1 });

    expect(out.ok && out.landed[0]).toMatchObject({ driverId: "t1", level: 6, refund: 50 });
    expect(out.balance).toBe(50);
    expect(ledgerOf(s, ME)).toEqual({ earned: 100, spent: 100, refunds: 50 });
  });

  test("a failure mid-pull rolls everything back", () => {
    const s = setup();
    const empty = { ...POOLS, 3: [] };

    expect(() => runPull({ ...s, pools: empty, random: seq(0.5) }, ASK)).toThrow();
    expect(s.repo.pulls.count(ME)).toBe(0);
    expect(s.repo.pity.get(ME, "limited").five).toBe(0);
  });

  test("the standard banner keeps its own counters", () => {
    const s = setup();
    const deps = { ...s, pools: POOLS, random: seq(0.5) };
    runPull(deps, { ...ASK, kind: "standard", featured: null, count: 3 });

    expect(s.repo.pity.get(ME, "standard").five).toBe(3);
    expect(s.repo.pity.get(ME, "limited").five).toBe(0);
  });
});
