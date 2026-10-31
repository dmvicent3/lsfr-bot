import { expect, test } from "bun:test";
import { JevError } from "../../../src/core/jev/http.ts";
import type { Jev } from "../../../src/core/jev/types.ts";
import { askJevos, jevosTurn } from "../../../src/modules/fleet/jevos.ts";
import { pick } from "../../../src/modules/fleet/pick.ts";
import { evidence, questions } from "../../../src/modules/fleet/prompt.ts";
import { playing, rowsFleet } from "./fixtures.ts";
import { allBut, sight } from "./sights.ts";

/** Records the keys asked and says yes to `yes`. */
function recorder(yes: string) {
  const seen = { calls: 0, keys: [] as string[] };
  const jev: Jev = {
    async yesNo(_state, qs) {
      seen.calls++;
      seen.keys = qs.map((q) => q.key);

      return new Map(seen.keys.map((k) => [k, k === yes ? 0.9 : 0.1]));
    },
  };

  return { jev, seen };
}

const answering = (answers: Map<string, number>): Jev => ({ yesNo: async () => answers });

const down: Jev = {
  yesNo: async () => {
    throw new JevError("jev is paused after a failure");
  },
};

/** jevos's turn with a lone hit on the player's Frigate at A5 (40): it targets B5, A4, A6. */
const wounded = () =>
  playing({
    jevos: { ships: rowsFleet(), shots: [40] },
    player: { ships: rowsFleet(), shots: [99] },
  });

test("one candidate: no question", async () => {
  // Every cell fired but B9 (81); the Patrol boat at A9-B9 is hit at A9, so B9 is the only target.
  const g = playing({ jevos: { ships: rowsFleet(), shots: allBut([81]) } });
  const { jev, seen } = recorder("B9");
  expect(await askJevos(jev, g, Math.random)).toBe(81);
  expect(seen.calls).toBe(0);
});

test("asks one question per candidate, keyed by cell name, and fires at the yes", async () => {
  const { jev, seen } = recorder("A6");
  const moved = await jevosTurn(jev, wounded(), Math.random, 5);
  expect(new Set(seen.keys)).toEqual(new Set(["A4", "B5", "A6"]));
  expect(moved.game.jevos.shots).toEqual([40, 50]);
  expect(moved.game.updatedAt).toBe(5);
});

test("jev down: a random candidate", async () => {
  expect([30, 41, 50]).toContain(await askJevos(down, wounded(), Math.random));
});

test("empty or unknown answers: a random candidate", async () => {
  expect([30, 41, 50]).toContain(await askJevos(answering(new Map()), wounded(), Math.random));
  const unknown = answering(new Map([["Z9", 1]]));
  expect([30, 41, 50]).toContain(await askJevos(unknown, wounded(), Math.random));
});

test("pick keeps to candidates close to the top", () => {
  const answers = new Map([
    ["A1", 0.9],
    ["B1", 0.8],
    ["C1", 0.2],
  ]);
  expect(pick(answers, [0, 1, 2], () => 0)).toBe(0);
  expect(pick(answers, [0, 1, 2], () => 0.99)).toBe(1);
  expect(pick(answers, [5], () => 0)).toBeNull();
});

test("evidence marks hits, misses and sunk cells", () => {
  const s = sight({ wounded: [40], misses: [45], sunk: [47, 48], afloat: [5, 3] });
  const text = evidence(s, [30, 41]);
  expect(text).toContain("\n   A B C D E F G H I J\n");
  expect(text).toContain("\n 5 x . . . . o . # # .\n");
  expect(text).toContain("Ships afloat: 5, 3");
  expect(text).toContain("A4: next to a hit");
  expect(text).toContain("B5: next to a hit, in line with 1 hit");
});

test("questions are keyed by cell name", () => {
  const qs = questions([0, 42]);
  expect(qs.map((q) => q.key)).toEqual(["A1", "C5"]);
  expect(qs[1]?.instructions).toStartWith("Should jevos fire at C5?");
});
