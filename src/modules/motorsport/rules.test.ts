import { describe, expect, test } from "bun:test";
import { applyRules } from "./rules.ts";
import { parseSportstimes } from "./sources/sportstimes.ts";
import { fixture } from "./sources/testing.ts";
import { parseTunous } from "./sources/tunous.ts";
import type { Session } from "./types.ts";

function pingable(sessions: Session[], eventId: string): string[] {
  return sessions.filter((s) => s.eventId === eventId && s.pingable).map((s) => s.sessionId);
}

describe("applyRules", () => {
  test("F1 pings qualifying, sprint qualifying, sprint and race", async () => {
    const sessions = applyRules(parseTunous("f1", 2026, await fixture("tunous-formula1")));
    expect(pingable(sessions, "2026-chinese-grand-prix")).toEqual([
      "sprint-qualification",
      "sprint-race",
      "qualifying",
      "race",
    ]);
  });

  test("WEC follows the source's significance flag", async () => {
    const sessions = applyRules(parseTunous("wec", 2026, await fixture("tunous-wec")));
    const imola = pingable(sessions, "2026-6-hours-of-imola");
    expect(imola).toContain("qualifying-lmgt3");
    expect(imola).toContain("hyperpole-hypercar");
    expect(imola).toContain("race");
    expect(imola.some((id) => id.startsWith("practice"))).toBe(false);
  });

  test("WRC pings only the first stage of each day", async () => {
    const sessions = applyRules(parseTunous("wrc", 2026, await fixture("tunous-wrc")));
    const monte = sessions.filter((s) => s.eventId === "2026-wrc-rallye-monte-carlo-2026");
    const ids = pingable(monte, "2026-wrc-rallye-monte-carlo-2026");
    expect(ids).toContain("ss1");
    expect(ids).toContain("ss4");
    for (const id of ["shakedown", "start", "ss2"]) expect(ids).not.toContain(id);
    const stageDays = new Set(
      monte
        .filter((s) => /^s?ss\d+$/.test(s.sessionId))
        .map((s) => s.start.toISOString().slice(0, 10)),
    );
    expect(ids.length).toBe(stageDays.size);
  });

  test("MotoGP pings Q1 (as Qualifying), sprint and race", async () => {
    const sessions = applyRules(parseSportstimes("motogp", 2026, await fixture("st-motogp")));
    expect(pingable(sessions, "2026-r1-Thailand").toSorted()).toEqual([
      "qualifying1",
      "race",
      "sprint",
    ]);
  });

  test("FE pings qualifying and race", async () => {
    const sessions = applyRules(parseSportstimes("fe", 2026, await fixture("st-fe")));
    expect(pingable(sessions, "2026-r1-sao-paulo-eprix").toSorted()).toEqual([
      "qualifying",
      "race",
    ]);
  });

  test("IndyCar never pings practice or warmup", async () => {
    const sessions = applyRules(parseSportstimes("indycar", 2026, await fixture("st-indycar")));
    const bad = sessions.filter(
      (s) => s.pingable && /^(practice|warmup|FinalPractice)/.test(s.sessionId),
    );
    expect(bad).toEqual([]);
  });

  test("F2 pings every feature race and no practice", async () => {
    const sessions = applyRules(parseSportstimes("f2", 2026, await fixture("st-f2")));
    expect(sessions.filter((s) => s.sessionId === "feature").every((s) => s.pingable)).toBe(true);
    expect(sessions.filter((s) => s.sessionId === "practice").some((s) => s.pingable)).toBe(false);
  });
});
