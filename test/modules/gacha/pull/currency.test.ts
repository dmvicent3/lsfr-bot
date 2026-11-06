import { expect, test } from "bun:test";
import { inCurrency } from "../../../../src/modules/gacha/pull/currency.ts";
import { earnedGames, ledgerOf } from "../../../../src/modules/gacha/pull/ledger.ts";
import { saveGachaPrice } from "../../../../src/modules/gacha/settings.ts";
import { ME, setup } from "../testing/setup.ts";

test("points stay as they are; pulls cost the price each, rounded", () => {
  expect(
    inCurrency(
      [
        { label: "Word", points: 120, unit: "points" as const },
        { label: "F1 predictions", points: 2.25, unit: "pulls" as const },
      ],
      140,
    ),
  ).toEqual([
    { label: "Word", points: 120, unit: "points" },
    { label: "F1 predictions", points: 315, unit: "pulls" },
  ]);
  expect(inCurrency([{ points: 0.333, unit: "pulls" as const }], 100)).toEqual([
    { points: 33, unit: "pulls" },
  ]);
});

test("the ledger counts a pulls source at the server's price", () => {
  const s = setup();
  const pulls = { game: "f1", label: "F1", unit: "pulls" as const, earned: () => 2.5 };
  const v = { repo: s.repo, sources: [...s.sources, pulls] };

  expect(ledgerOf(v, ME).earned).toBe(1000 + 350);
  saveGachaPrice(s.db, ME.guildId, 200);
  expect(ledgerOf(v, ME).earned).toBe(1000 + 500);
  expect(earnedGames(v, ME).map((g) => g.points)).toEqual([1000, 500]);
});
