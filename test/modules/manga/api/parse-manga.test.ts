import { describe, expect, test } from "bun:test";
import { parseManga } from "../../../../src/modules/manga/api/parse-manga.ts";
import { FRIEREN, GANTZ_E, POLE_STAR, responses } from "../fixtures.ts";

const [poleStar, gantz, frieren] = responses.details.data;

describe("parseManga", () => {
  test("reads title, latest upload, cover and author", () => {
    expect(parseManga(poleStar ?? {})).toEqual({
      id: POLE_STAR,
      title: "POLE STAR",
      latestUpload: "83ee246e-347d-403c-a2ca-f02ca992ebca",
      coverFile: "5edb8b2c-9051-481f-ab81-e57c21b5d96c.jpg",
      author: "NON",
    });
  });

  test("prefers the first English alt title", () => {
    expect(parseManga(frieren ?? {})).toMatchObject({
      id: FRIEREN,
      title: "Frieren: Beyond Journey's End",
    });
  });

  test("falls back to the romaji title", () => {
    expect(parseManga(gantz ?? {})).toMatchObject({ id: GANTZ_E, title: "Gantz: E" });
  });

  test("title.en before romaji, then any title", () => {
    const base = { id: "x", relationships: [] };
    const titled = (title: Record<string, string>) => ({
      ...base,
      attributes: { title, altTitles: [] },
    });
    expect(parseManga(titled({ en: "E", "ja-ro": "R" }))?.title).toBe("E");
    expect(parseManga(titled({ ko: "K" }))?.title).toBe("K");
  });

  test("junk is null; missing cover and author are null", () => {
    expect(parseManga({})).toBeNull();
    expect(parseManga({ id: "x", attributes: { title: { en: "T" } } })).toEqual({
      id: "x",
      title: "T",
      latestUpload: null,
      coverFile: null,
      author: null,
    });
  });
});
