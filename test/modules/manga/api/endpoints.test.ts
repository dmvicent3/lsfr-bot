import { describe, expect, test } from "bun:test";
import { mangaDetails } from "../../../../src/modules/manga/api/details.ts";
import { mangaFeed } from "../../../../src/modules/manga/api/feed.ts";
import { latestChapter } from "../../../../src/modules/manga/api/latest.ts";
import { searchManga } from "../../../../src/modules/manga/api/search.ts";
import type { MangaDexGet, Query } from "../../../../src/modules/manga/api/types.ts";
import { FRIEREN, POLE_STAR, responses } from "../fixtures.ts";

function recording(answer: (path: string, q: Query) => unknown) {
  const calls: { path: string; q: Query }[] = [];

  const get: MangaDexGet = async (path, q) => {
    calls.push({ path, q });

    return answer(path, q);
  };

  return { get, calls };
}

describe("searchManga", () => {
  test("asks by title and returns hits", async () => {
    const { get, calls } = recording(() => responses.search);
    const hits = await searchManga(get, "frieren");
    expect(hits[1]).toEqual({
      id: "1d55e985-8379-41bc-aeca-acd069bcadd0",
      title: "Frieren at the Funeral -  Dreams About Fern",
    });
    expect(calls[0]?.q).toMatchObject({ title: "frieren", limit: "25" });
    expect(calls[0]?.q["contentRating[]"]).toHaveLength(4);
  });
});

describe("latestChapter", () => {
  test("the newest English chapter number, or null", async () => {
    expect(await latestChapter(recording(() => responses.latest).get, POLE_STAR)).toBe(36);
    expect(await latestChapter(recording(() => responses.latestEmpty).get, FRIEREN)).toBeNull();
  });

  test("leaves out chapters scheduled for later", async () => {
    const { get, calls } = recording(() => responses.latest);
    await latestChapter(get, POLE_STAR);
    expect(calls[0]?.q["includeFutureUpdates"]).toBe("0");
  });
});

describe("mangaDetails", () => {
  test("by id, in chunks of 100", async () => {
    const { get, calls } = recording(() => responses.details);
    const ids = Array.from({ length: 150 }, (_, n) => `id${n}`);
    const map = await mangaDetails(get, ids);
    expect(calls.map((c) => c.q["ids[]"]?.length)).toEqual([100, 50]);
    expect(calls[0]?.q["includes[]"]).toEqual(["cover_art", "author"]);
    expect(map.get(POLE_STAR)?.author).toBe("NON");
  });

  test("no ids, no call", async () => {
    const { get, calls } = recording(() => responses.details);
    expect((await mangaDetails(get, [])).size).toBe(0);
    expect(calls).toHaveLength(0);
  });
});

describe("mangaFeed", () => {
  test("pages through the total and formats the since time", async () => {
    const page = { ...responses.feed, total: 150, limit: 100 };
    const { get, calls } = recording(() => page);
    const chapters = await mangaFeed(get, POLE_STAR, Date.UTC(2026, 9, 26, 12, 0, 0, 500));
    expect(calls.map((c) => c.q["offset"])).toEqual(["0", "100"]);
    expect(calls[0]?.path).toBe(`/manga/${POLE_STAR}/feed`);
    expect(calls[0]?.q).toMatchObject({
      "translatedLanguage[]": ["en"],
      publishAtSince: "2026-10-26T12:00:00",
      includeFutureUpdates: "0",
      "order[readableAt]": "asc",
      "includes[]": ["scanlation_group"],
      limit: "100",
    });
    expect(chapters).toHaveLength(6);
  });
});
