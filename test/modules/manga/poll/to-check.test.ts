import { describe, expect, test } from "bun:test";
import type { MangaInfo } from "../../../../src/modules/manga/api/types.ts";
import { toCheck } from "../../../../src/modules/manga/poll/to-check.ts";
import { series } from "../store/fixtures.ts";

const HOUR = 3_600_000;
const NOW = 100 * HOUR;

const info = (id: string, latestUpload: string): MangaInfo => ({
  id,
  title: "T",
  latestUpload,
  coverFile: null,
  author: null,
});

describe("toCheck", () => {
  const fresh = NOW - 23 * HOUR;
  const stale = NOW - 25 * HOUR;

  test("a changed latest upload is checked", () => {
    const s = series({ latestUpload: "c1", checkedAt: fresh });
    expect(toCheck([s], new Map([["m1", info("m1", "c2")]]), NOW)).toEqual([s]);
  });

  test("unchanged is checked only after 24 hours", () => {
    const freshOne = series({ id: "m1", latestUpload: "c1", checkedAt: fresh });
    const staleOne = series({ id: "m2", latestUpload: "c1", checkedAt: stale });
    const details = new Map([
      ["m1", info("m1", "c1")],
      ["m2", info("m2", "c1")],
    ]);
    expect(toCheck([freshOne, staleOne], details, NOW)).toEqual([staleOne]);
  });

  test("a manga MangaDex no longer returns is skipped", () => {
    expect(toCheck([series({ checkedAt: stale })], new Map(), NOW)).toEqual([]);
  });
});
