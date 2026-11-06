import { describe, expect, test } from "bun:test";
import { chipOptions } from "../../../../src/modules/motorsport/predictions/chip-options.ts";
import {
  chipRefusal,
  usedElsewhere,
} from "../../../../src/modules/motorsport/predictions/chip-rules.ts";
import type { Chip } from "../../../../src/modules/motorsport/predictions/types.ts";
import { QUALI, RACE, SPRINT, SQ } from "../testing/fantasy.ts";

const DOUBLE: Chip = { kind: "double", sessionId: null, position: null };
const TRIPLE: Chip = { kind: "triple", sessionId: "race", position: 0 };

describe("chipOptions", () => {
  test("No chip, every unused chip, Triple Pick per open session and position", () => {
    const options = chipOptions({ used: new Set(), current: null, open: [QUALI, RACE] });
    expect(options.map((o) => o.label)).toEqual([
      "No chip",
      "⏫ Double Weekend",
      "🎯 Triple Pick: Qualifying P1",
      "🎯 Triple Pick: Qualifying P2",
      "🎯 Triple Pick: Qualifying P3",
      "🎯 Triple Pick: Race P1",
      "🎯 Triple Pick: Race P2",
      "🎯 Triple Pick: Race P3",
      "🛡️ Safety Net",
      "🔁 Late Swap",
    ]);
    expect(options.filter((o) => o.default).map((o) => o.value)).toEqual(["none"]);
    expect(options[5]?.value).toBe("triple:race:0");
  });

  test("chips played on other weekends are gone; the current one is preselected", () => {
    const options = chipOptions({
      used: new Set(["double", "safety"]),
      current: TRIPLE,
      open: [SQ, SPRINT, QUALI, RACE],
    });
    expect(options).toHaveLength(1 + 12 + 1);
    expect(options.some((o) => o.label.includes("Double"))).toBe(false);
    expect(options.filter((o) => o.default).map((o) => o.label)).toEqual([
      "🎯 Triple Pick: Race P1",
    ]);
  });

  test("never more than 25 options", () => {
    const many = Array.from({ length: 10 }, (_, i) => ({ ...RACE, sessionId: `s${i}` }));
    expect(chipOptions({ used: new Set(), current: null, open: many })).toHaveLength(25);
  });
});

describe("chip rules", () => {
  const open = [QUALI, RACE];
  const season = [
    { userId: "u", eventId: "earlier", chip: DOUBLE },
    { userId: "u", eventId: "e", chip: TRIPLE },
  ];

  test("once a season: played on another weekend is refused, this weekend's can change", () => {
    const used = usedElsewhere(season, "e");
    expect(used).toEqual(new Set(["double"]));
    expect(chipRefusal({ chosen: DOUBLE, used, locked: false, open })).toBe(
      "You already played Double Weekend this season: each chip is once a season.",
    );
    expect(chipRefusal({ chosen: TRIPLE, used, locked: false, open })).toBeNull();
    expect(chipRefusal({ chosen: null, used, locked: false, open })).toBeNull();
  });

  test("frozen at the lock, even clearing it", () => {
    const locked = { used: new Set<Chip["kind"]>(), locked: true, open };
    expect(chipRefusal({ ...locked, chosen: DOUBLE })).toStartWith("🔒");
    expect(chipRefusal({ ...locked, chosen: null })).toStartWith("🔒");
  });

  test("Triple Pick marks an open session", () => {
    const chosen: Chip = { kind: "triple", sessionId: "sprint-race", position: 0 };
    expect(chipRefusal({ chosen, used: new Set(), locked: false, open })).toBe(
      "That session isn't open for predictions.",
    );
  });
});
