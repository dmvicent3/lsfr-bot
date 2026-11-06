import { Database } from "bun:sqlite";
import { beforeEach, describe, expect, test } from "bun:test";
import { runMigrations } from "../../../../src/core/db.ts";
import { coreMigrations } from "../../../../src/core/settings.ts";
import { saveChip } from "../../../../src/modules/motorsport/predictions/chip-actions.ts";
import {
  predictionsPost,
  seasonLeaderboard,
} from "../../../../src/modules/motorsport/predictions/leaderboard-actions.ts";
import { predictPicker } from "../../../../src/modules/motorsport/predictions/picker-actions.ts";
import { savePick } from "../../../../src/modules/motorsport/predictions/predict-actions.ts";
import type { Chip } from "../../../../src/modules/motorsport/predictions/types.ts";
import { MotorsportRepo } from "../../../../src/modules/motorsport/repo.ts";
import type { ResultRow } from "../../../../src/modules/motorsport/results/types.ts";
import { motorsportMigrations } from "../../../../src/modules/motorsport/store/migrations.ts";
import type { Session } from "../../../../src/modules/motorsport/types.ts";

/** Qualifying an hour after T locks the weekend; the race is a day after. */
const T = Date.parse("2026-03-14T07:00:00Z");
const HOUR = 3_600_000;
const LOCKED = T + 2 * HOUR;
let repo: MotorsportRepo;

const session = (sessionId: string, title: string, start: number): Session => ({
  series: "f1",
  eventId: "e",
  eventName: "Chinese Grand Prix",
  sessionId,
  title,
  start: new Date(start),
  end: new Date(start + HOUR),
  pingable: true,
});
const QUALI = session("qualifying", "Qualifying", T + HOUR);
const RACE = session("race", "Race", T + 24 * HOUR);

const ROWS: ResultRow[] = [
  { pos: "1", id: "3", name: "Verstappen", team: "", time: "" },
  { pos: "2", id: "4", name: "Norris", team: "", time: "" },
  { pos: "3", id: "16", name: "Leclerc", team: "", time: "" },
];

const result = (sessionId: string, kind: "qualifying" | "race", postedAt: number) => ({
  series: "f1" as const,
  eventId: "e",
  eventName: "E",
  sessionId,
  kind,
  rows: ROWS,
  postedAt,
});

beforeEach(() => {
  const db = new Database(":memory:", { strict: true });
  runMigrations(db, [...coreMigrations, ...motorsportMigrations]);
  repo = new MotorsportRepo(db);
  repo.sessions.replace("f1", [QUALI, RACE], T);
  repo.results.insert({ ...result("qualifying", "qualifying", 1), eventId: "before" });
});

const plain = (kind: Chip["kind"]): Chip => ({ kind, sessionId: null, position: null });
const at = (now: number, userId = "u1") => ({ userId, now });
const ref = (sessionId: string) => ({ series: "f1" as const, eventId: "e", sessionId });
const pick = (now: number, sessionId: string) =>
  savePick(repo, at(now), ref(sessionId), { index: 0, driverId: "3" });
const chip = (now: number, value: string) => saveChip(repo, at(now), ref(""), value);
const playedBefore = (kind: Chip["kind"]) =>
  repo.chips.set({ series: "f1", season: 2026, eventId: "before" }, "u1", plain(kind), 1);

const notFound = async () => new Response("{}", { status: 404 });

async function picker(now: number, sessionId?: string) {
  const p = await predictPicker(repo, at(now), { ...ref(""), sessionId }, notFound);

  return typeof p === "string" ? { content: p, components: [] } : p;
}

describe("the F1 weekend lock", () => {
  test("qualifying and race open until the first session, both locked after", () => {
    expect(pick(T, "qualifying").ok).toBe(true);
    expect(pick(T, "race").ok).toBe(true);
    expect(pick(LOCKED, "race")).toEqual({
      ok: false,
      text: "🔒 Predictions for the Chinese Grand Prix weekend locked at its first session.",
    });
  });

  test("Late Swap reopens the race (only) after the lock, until it starts", () => {
    expect(chip(T, "lateswap")).toBeNull();
    expect(pick(LOCKED, "race").ok).toBe(true);
    expect(pick(LOCKED, "qualifying").ok).toBe(false);
    expect(pick(RACE.start.getTime(), "race").ok).toBe(false);
  });
});

describe("chips", () => {
  test("played, changed and cleared until the lock, then frozen", () => {
    expect(chip(T, "double")).toBeNull();
    expect(repo.chips.get("f1", "e", "u1")?.kind).toBe("double");
    expect(chip(T, "triple:race:0")).toBeNull();
    expect(repo.chips.get("f1", "e", "u1")).toEqual({
      kind: "triple",
      sessionId: "race",
      position: 0,
    });
    expect(chip(T, "none")).toBeNull();
    expect(repo.chips.get("f1", "e", "u1")).toBeNull();
    expect(chip(T, "safety")).toBeNull();
    expect(chip(LOCKED, "none")).toStartWith("🔒");
    expect(repo.chips.get("f1", "e", "u1")?.kind).toBe("safety");
  });

  test("once a season: a chip played on another weekend is refused", () => {
    playedBefore("double");
    expect(chip(T, "double")).toBe(
      "You already played Double Weekend this season: each chip is once a season.",
    );
    expect(chip(T, "safety")).toBeNull();
  });

  test("other series have none", () => {
    expect(saveChip(repo, at(T), { series: "motogp", eventId: "e" }, "double")).toBe(
      "That weekend has no chips.",
    );
  });
});

describe("the F1 picker", () => {
  test("header says when the weekend locks; the fifth row is the chip select", async () => {
    playedBefore("safety");
    chip(T, "triple:race:1");
    const p = await picker(T, "qualifying");
    expect(p.content).toBe(
      [
        "🔮 **F1 Chinese Grand Prix Qualifying** podium · weekend locks <t:1773475200:R>",
        "Pick all three to enter.",
        "Chip: 🎯 Triple Pick: Race P2, until the weekend locks.",
      ].join("\n"),
    );
    expect(p.components).toHaveLength(5);
    const select = p.components[4]?.components[0];
    expect(select).toMatchObject({ custom_id: "motorsport:chip:f1:e:qualifying" });
    const json = JSON.stringify(select);
    expect(json).toContain(
      '"value":"triple:race:1","description":"This pick scores ×3","default":true',
    );
    expect(json).not.toContain("Safety Net");
  });

  test("after the lock: Late Swap's race picker without a chip select, or nothing", async () => {
    expect((await picker(LOCKED)).content).toBe(
      "🔒 The Chinese Grand Prix weekend is locked: predictions closed at its first session.",
    );
    chip(T, "lateswap");
    const p = await picker(LOCKED);
    expect(p.content).toBe(
      [
        "🔮 **F1 Chinese Grand Prix Race** podium · 🔁 Late Swap · locks <t:1773558000:R>",
        "Pick all three to enter.",
        "Chip: 🔁 Late Swap (locked in).",
      ].join("\n"),
    );
    expect(p.components).toHaveLength(3);
  });
});

describe("scoring", () => {
  beforeEach(() => {
    for (const userId of ["u1", "u2"]) {
      for (const s of ["qualifying", "race"]) {
        repo.predictions.set(at(T, userId), ref(s), ["3", "4", "16"]);
      }
    }

    chip(T, "double");
    repo.results.insert(result("qualifying", "qualifying", T + 2 * HOUR));
    repo.results.insert(result("race", "race", T + 26 * HOUR));
  });

  test("the season table counts qualifying too, after chips, with pulls", () => {
    expect(seasonLeaderboard(repo, "f1", T)).toBe(
      [
        "## 🔮 F1 predictions — 2026 season",
        "**1.** <@u1> · **80** pts · 2 perfect · 2 sessions · 60 pulls",
        "**2.** <@u2> · **40** pts · 2 perfect · 2 sessions · 30 pulls",
      ].join("\n"),
    );
  });

  test("the qualifying results post shows chips and pulls", () => {
    expect(predictionsPost(repo, QUALI, "qualifying", ROWS)).toBe(
      [
        "### 🔮 Predictions",
        "||<@u1> Verstappen · Norris · Leclerc → **40** pts 🎯 · ⏫ Double Weekend · 20 pulls",
        "<@u2> Verstappen · Norris · Leclerc → **20** pts 🎯 · 10 pulls||",
      ].join("\n"),
    );
    expect(predictionsPost(repo, { ...QUALI, eventId: "none" }, "qualifying", ROWS)).toBeNull();
  });
});
