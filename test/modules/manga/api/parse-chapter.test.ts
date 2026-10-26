import { describe, expect, test } from "bun:test";
import { parseChapter } from "../../../../src/modules/manga/api/parse-chapter.ts";
import { POLE_STAR, responses } from "../fixtures.ts";

const [ch36, ch35, ch34] = responses.feed.data;

describe("parseChapter", () => {
  test("reads a chapter with its group", () => {
    expect(parseChapter(ch36 ?? {})).toEqual({
      id: "83ee246e-347d-403c-a2ca-f02ca992ebca",
      mangaId: POLE_STAR,
      number: "36",
      title: "Proof",
      group: "Fe Scans",
      externalUrl: null,
      readableAt: "2026-10-26T20:05:11+00:00",
    });
  });

  test("keeps the external url and a missing group", () => {
    expect(parseChapter(ch35 ?? {})?.externalUrl).toBe(
      "https://mangaplus.shueisha.co.jp/viewer/1000000",
    );
    expect(parseChapter(ch34 ?? {})?.group).toBeNull();
  });

  test("an unnumbered chapter and junk", () => {
    const oneshot = {
      id: "c",
      attributes: { chapter: null, title: "", readableAt: "2026-10-26T00:00:00+00:00" },
      relationships: [{ id: "m", type: "manga" }],
    };
    expect(parseChapter(oneshot)).toMatchObject({ number: null, title: null, mangaId: "m" });
    expect(parseChapter({})).toBeNull();
    expect(parseChapter({ id: "c", attributes: {}, relationships: [] })).toBeNull();
  });
});
