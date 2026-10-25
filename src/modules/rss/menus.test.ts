import { describe, expect, test } from "bun:test";
import { ComponentType } from "discord.js";
import { feedMenu, ruleMessage, rulePicker } from "./menus.ts";
import type { Rule } from "./rules.ts";

const feeds = [
  { id: 7, name: "TASS" },
  { id: 8, name: "Euronews" },
  { id: 9, name: "SpaceNews" },
];
const europe: Rule = { id: 4, text: "Europe", kind: "only", feedIds: [7, 8] };
const sports: Rule = { id: 3, text: "sports", kind: "block", feedIds: [] };

describe("feedMenu", () => {
  test("is a multi-select of the server's feeds with the rule's feeds ticked", () => {
    const row = feedMenu(europe, feeds);
    expect(row?.type).toBe(ComponentType.ActionRow);
    expect(row?.components[0]).toMatchObject({
      type: ComponentType.StringSelect,
      custom_id: "rss:feeds:4",
      placeholder: "Applies to: all feeds",
      min_values: 0,
      max_values: 3,
      options: [
        { label: "TASS", value: "7", default: true },
        { label: "Euronews", value: "8", default: true },
        { label: "SpaceNews", value: "9", default: false },
      ],
    });
  });

  test("offers at most Discord's 25 options and nothing without feeds", () => {
    const many = Array.from({ length: 30 }, (_, n) => ({ id: n, name: `F${n}` }));
    const menu = feedMenu(sports, many)?.components[0];
    expect(menu?.options).toHaveLength(25);
    expect(menu?.max_values).toBe(25);
    expect(feedMenu(sports, [])).toBeNull();
  });
});

describe("rulePicker", () => {
  test("lists each rule, described, by id", () => {
    expect(rulePicker([sports, europe], feeds)?.components[0]).toMatchObject({
      custom_id: "rss:pick",
      options: [
        { label: "🚫 Is this article about sports? (all feeds)", value: "3" },
        { label: "✅ only: Is this article about Europe? (TASS, Euronews)", value: "4" },
      ],
    });
    expect(rulePicker([], feeds)).toBeNull();
  });
});

describe("ruleMessage", () => {
  test("explains the rule and where it applies, with the feed menu", () => {
    const msg = ruleMessage(europe, feeds);
    expect(msg.content).toContain(
      'posted only when the answer to "Is this article about Europe?" is yes',
    );
    expect(msg.content).toContain("Applies to: TASS, Euronews.");
    expect(msg.components).toHaveLength(1);
    const block = ruleMessage(sports, feeds);
    expect(block.content).toContain(
      'not posted when the answer to "Is this article about sports?" is yes',
    );
    expect(block.content).toContain("Applies to: all feeds. Pick feeds below to limit it.");
  });

  test("has no menu while the server follows no feeds", () => {
    expect(ruleMessage(sports, []).components).toEqual([]);
  });
});
