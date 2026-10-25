import { describe, expect, test } from "bun:test";
import type { FeedItem } from "../../../../src/modules/rss/feeds/types.ts";
import { renderItem } from "../../../../src/modules/rss/cycle/render.ts";

const item: FeedItem = {
  title: "EU agrees new chip law",
  link: "https://news.example.com/chips",
  guid: "g",
  description: "Member states back a plan.",
  publishedAt: Date.UTC(2026, 9, 24, 9, 30),
  image: "https://news.example.com/chips.jpg",
};

describe("renderItem", () => {
  test("links the title and shows feed, date, description and image", () => {
    expect(renderItem(item, "Example News")).toEqual({
      title: "EU agrees new chip law",
      url: "https://news.example.com/chips",
      description: "Member states back a plan.",
      footer: { text: "Example News" },
      timestamp: "2026-10-24T09:30:00.000Z",
      image: { url: "https://news.example.com/chips.jpg" },
    });
  });

  test("leaves out what the item does not have", () => {
    expect(
      renderItem({ ...item, link: null, description: "", publishedAt: null, image: null }, "F"),
    ).toEqual({ title: "EU agrees new chip law", footer: { text: "F" } });
  });

  test("cuts a long title to 256 and a long description to 300 characters", () => {
    const embed = renderItem(
      { ...item, title: "t".repeat(300), description: "d".repeat(400) },
      "F",
    );
    expect(embed.title).toHaveLength(256);
    expect(embed.title?.endsWith("…")).toBe(true);
    expect(embed.description).toHaveLength(300);
    expect(embed.description?.endsWith("…")).toBe(true);
  });

  test("gives an untitled item a placeholder title", () => {
    expect(renderItem({ ...item, title: "" }, "F").title).toBe("(untitled)");
  });
});

describe("renderItem URL safety", () => {
  test("drops links and images that are not absolute http(s) URLs, and caps the footer", () => {
    const embed = renderItem(
      { ...item, link: "/rel/path", image: "javascript:alert(1)" },
      "f".repeat(3000),
    );
    expect(embed.url).toBeUndefined();
    expect(embed.image).toBeUndefined();
    expect(embed.footer?.text).toHaveLength(100);
  });
});
