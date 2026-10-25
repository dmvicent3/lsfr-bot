import { describe, expect, test } from "bun:test";
import { SourceFormatError } from "../../../../../src/modules/motorsport/types.ts";
import { find, fixture } from "../../testing/fixtures.ts";
import { parseTunous } from "../../../../../src/modules/motorsport/schedule/sources/tunous.ts";

describe("parseTunous", () => {
  test("F1 sprint weekend sessions and significance", async () => {
    const sessions = parseTunous("f1", 2026, await fixture("tunous-formula1"));
    const china = sessions.filter((s) => s.eventId === "2026-chinese-grand-prix");
    expect(china.map((s) => s.sessionId)).toEqual([
      "practice-1",
      "sprint-qualification",
      "sprint-race",
      "qualifying",
      "race",
    ]);
    expect(china.filter((s) => !s.significant).map((s) => s.sessionId)).toEqual(["practice-1"]);
    expect(china[0]?.series).toBe("f1");
    expect(china[0]?.eventName).toBe("Chinese Grand Prix");
  });

  test("skips cancelled events", async () => {
    const sessions = parseTunous("f1", 2026, await fixture("tunous-formula1"));
    const ids = new Set(sessions.map((s) => s.eventId));
    expect(ids.has("2026-bahrain-grand-prix")).toBe(false);
    expect(ids.has("2026-saudi-arabian-grand-prix")).toBe(false);
  });

  test("WEC times and event name", async () => {
    const fp1 = find(
      parseTunous("wec", 2026, await fixture("tunous-wec")),
      "2026-6-hours-of-imola",
      "practice-1",
    );
    expect(fp1.start.toISOString()).toBe("2026-04-17T08:15:00.000Z");
    expect(fp1.end.toISOString()).toBe("2026-04-17T09:45:00.000Z");
    expect(fp1.eventName).toBe("6 Hours of Imola");
  });

  test("WRC stage start", async () => {
    const ss1 = find(
      parseTunous("wrc", 2026, await fixture("tunous-wrc")),
      "2026-wrc-rallye-monte-carlo-2026",
      "ss1",
    );
    expect(ss1.start.toISOString()).toBe("2026-01-22T15:05:00.000Z");
  });

  test("rejects a wrong shape", () => {
    expect(() => parseTunous("f1", 2026, [{ id: 1 }])).toThrow(SourceFormatError);
    expect(() => parseTunous("f1", 2026, { a: 1 })).toThrow(SourceFormatError);
  });
});
