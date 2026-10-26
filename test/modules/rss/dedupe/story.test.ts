import { describe, expect, test } from "bun:test";
import { storyText } from "../../../../src/modules/rss/dedupe/story.ts";

const GOOGLE = "https://news.google.com/rss?hl=en-US&ceid=US:en&gl=US";
const TASS = "https://tass.com/rss/v2.xml";
const Q = "task: sentence similarity | query: ";

describe("storyText", () => {
  test("drops the publisher from Google News titles", () => {
    expect(storyText("Lula wins - Reuters", GOOGLE)).toBe(`${Q}Lula wins`);
  });

  test("drops only the last dash part", () => {
    expect(storyText("A - B - The Guardian", GOOGLE)).toBe(`${Q}A - B`);
  });

  test("leaves a Google News title without a publisher alone", () => {
    expect(storyText("Lula wins", GOOGLE)).toBe(`${Q}Lula wins`);
  });

  test("keeps the dash part on other feeds", () => {
    expect(storyText("Lula wins - Reuters", TASS)).toBe(`${Q}Lula wins - Reuters`);
  });

  test("a blank title has no story text", () => {
    expect(storyText("   ", TASS)).toBeNull();
    expect(storyText(" - Reuters", GOOGLE)).toBeNull();
  });

  test("an invalid feed URL counts as another feed", () => {
    expect(storyText("Lula wins - Reuters", "not a url")).toBe(`${Q}Lula wins - Reuters`);
  });
});
