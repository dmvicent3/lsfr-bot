import { describe, expect, test } from "bun:test";
import { DAY_MS, dateOfMs, dayMs } from "../../../../src/core/periods.ts";
import { loadBank } from "../../../../src/modules/groups/bank/load.ts";
import { clashes } from "../../../../src/modules/groups/generate/clash.ts";
import { membersOf } from "../../../../src/modules/groups/generate/pick.ts";
import { AVOID_DAYS, dailyMake } from "../../../../src/modules/groups/play/make.ts";
import type { Puzzle } from "../../../../src/modules/groups/types.ts";
import { freshDb } from "../store/fixtures.ts";

const bank = loadBank();
const DAYS = 60;

/** Sixty days of one server's dailies, each stored before the next is made. */
function season(guildId: string): Puzzle[] {
  const { repo } = freshDb();
  const start = dayMs("2026-11-05");

  return Array.from({ length: DAYS }, (_, d) => {
    const date = dateOfMs(start + d * DAY_MS);
    const p = dailyMake(repo, { guildId, date }, bank)();

    if (!p) throw new Error(`no puzzle on ${date}`);

    return repo.puzzles.create(guildId, date, p);
  });
}

describe("the real bank", () => {
  test("has a few hundred categories on every level", () => {
    expect(bank.length).toBeGreaterThan(150);
    expect(
      [0, 1, 2, 3].map((l) => bank.filter((c) => c.level === l).length).every((n) => n > 30),
    ).toBe(true);
  });

  test("sixty dailies: no category back within the avoid window, and every board is clean", () => {
    const days = season("g");

    days.forEach((p, d) => {
      const recent = days
        .slice(Math.max(0, d - AVOID_DAYS), d)
        .flatMap((q) => q.groups.map((g) => g.name));
      const words = p.groups.flatMap((g) => g.words);

      expect(p.groups.map((g) => g.level)).toEqual([0, 1, 2, 3]);
      expect(p.groups.filter((g) => recent.includes(g.name))).toEqual([]);
      expect(words.filter((w, i) => words.some((v, j) => j !== i && clashes(w, v)))).toEqual([]);

      for (const g of p.groups) {
        const others = bank.filter((c) => p.groups.some((h) => h.name === c.name && h !== g));
        const stray = g.words.filter((w) => others.some((c) => membersOf(c).has(w)));

        expect(stray).toEqual([]);
      }
    });
  });
});
