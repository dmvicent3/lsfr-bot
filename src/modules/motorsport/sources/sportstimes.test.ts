import { describe, expect, test } from "bun:test";
import { SourceFormatError } from "../types.ts";
import { parseSportstimes } from "./sportstimes.ts";
import { find, fixture } from "./testing.ts";

describe("parseSportstimes", () => {
  test("MotoGP titles and default race duration", async () => {
    const sessions = parseSportstimes("motogp", await fixture("st-motogp"));
    const q1 = find(sessions, "Thailand", "qualifying1");
    expect(q1.title).toBe("Qualifying");
    expect(q1.start.toISOString()).toBe("2026-02-28T03:50:00.000Z");
    expect(q1.significant).toBe(false);
    expect(find(sessions, "Thailand", "qualifying2").title).toBe("Qualifying 2");
    expect(find(sessions, "Thailand", "race").end.toISOString()).toBe("2026-03-01T10:00:00.000Z");
  });

  test("FE qualifying lasts one hour by default", async () => {
    const q = find(parseSportstimes("fe", await fixture("st-fe")), "sao-paulo-eprix", "qualifying");
    expect(q.start.toISOString()).toBe("2025-12-06T12:40:00.000Z");
    expect(q.end.toISOString()).toBe("2025-12-06T13:40:00.000Z");
    expect(q.eventName).toBe("Sao Paulo ePrix");
  });

  test("rejects an invalid date", () => {
    const bad = { races: [{ name: "x", slug: "x", sessions: { race: "nope" } }] };
    expect(() => parseSportstimes("f2", bad)).toThrow(SourceFormatError);
  });
});
