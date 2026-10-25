import { describe, expect, test } from "bun:test";
import { FeedError, MAX_ITEMS, parseFeed } from "./parse.ts";

const fixture = (name: string) => Bun.file(`${import.meta.dir}/fixtures/${name}`).text();

describe("parseFeed", () => {
  test("reads RSS 2.0 items", async () => {
    const feed = parseFeed(await fixture("rss2.xml"));
    expect(feed.title).toBe("Example News");
    expect(feed.items).toEqual([
      {
        title: "EU agrees new chip law",
        link: "https://news.example.com/chips?utm_source=rss",
        guid: "news-1001",
        description: "Member states back a & plan for semiconductors.",
        publishedAt: Date.UTC(2026, 9, 24, 9, 30),
        image: null,
      },
      {
        title: "Second story",
        link: "https://news.example.com/second",
        guid: null,
        description: "Plain text.",
        publishedAt: null,
        image: null,
      },
    ]);
  });

  test("reads Atom entries", async () => {
    const feed = parseFeed(await fixture("atom.xml"));
    expect(feed.title).toBe("Atom Blog");
    expect(feed.items[0]).toEqual({
      title: "Release 2.0 & more",
      link: "https://blog.example.org/posts/1",
      guid: "tag:blog.example.org,2026:1",
      description: "Short summary.",
      publishedAt: Date.UTC(2026, 9, 22, 8),
      image: null,
    });
    expect(feed.items[1]).toMatchObject({
      link: "https://blog.example.org/posts/2",
      description: "Body bold",
      publishedAt: Date.UTC(2026, 9, 24, 12),
    });
  });

  test("turns CDATA and HTML into plain text", async () => {
    const feed = parseFeed(await fixture("cdata.xml"));
    expect(feed.title).toBe("CDATA Times");
    expect(feed.items[0]?.title).toBe("It’s here");
    expect(feed.items[0]?.description).toBe("First line & more Second line");
  });

  test("finds item images", async () => {
    const images = parseFeed(await fixture("media.xml")).items.map((i) => i.image);
    expect(images).toEqual([
      "https://m.example.com/1.jpg",
      "https://m.example.com/2.jpg",
      "https://m.example.com/3.png",
      null,
    ]);
  });

  test("keeps the first 50 items", () => {
    const items = Array.from(
      { length: 60 },
      (_, n) => `<item><title>n${n}</title><link>https://x.example/${n}</link></item>`,
    ).join("");
    const feed = parseFeed(`<rss><channel><title>t</title>${items}</channel></rss>`);
    expect(feed.items).toHaveLength(MAX_ITEMS);
    expect(feed.items.at(-1)?.title).toBe("n49");
  });

  test("rejects what is not a feed", () => {
    expect(() => parseFeed("<html><body>hi</body></html>")).toThrow(FeedError);
    expect(() => parseFeed("not xml at all {")).toThrow(FeedError);
    expect(() => parseFeed("")).toThrow(FeedError);
  });
});
