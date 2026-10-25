import { describe, expect, test } from "bun:test";
import { itemKey } from "./dedupe.ts";

describe("itemKey", () => {
  test("uses the guid when there is one", () => {
    expect(itemKey({ guid: "  news-1 ", link: "https://a.example/x" })).toBe("news-1");
  });

  test("falls back to the link without fragment or tracking parameters, host lowercased", () => {
    expect(
      itemKey({
        guid: null,
        link: "https://News.Example.COM/a?id=7&utm_source=rss&utm_medium=feed#top",
      }),
    ).toBe("https://news.example.com/a?id=7");
    expect(itemKey({ guid: " ", link: "https://a.example/b?utm_campaign=x" })).toBe(
      "https://a.example/b",
    );
  });

  test("keeps a link that is not a URL as it is", () => {
    expect(itemKey({ guid: null, link: " /relative/path " })).toBe("/relative/path");
  });

  test("has no key without guid or link", () => {
    expect(itemKey({ guid: null, link: null })).toBeNull();
    expect(itemKey({ guid: "  ", link: "" })).toBeNull();
  });
});
