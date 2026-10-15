import { Database } from "bun:sqlite";
import { beforeEach, describe, expect, test } from "bun:test";
import { runMigrations } from "../../core/db.ts";
import { coreMigrations } from "../../core/settings.ts";
import { type Followed, motorsportMigrations, MotorsportRepo, type StoredResult } from "./repo.ts";
import type { Session } from "./types.ts";

let repo: MotorsportRepo;

beforeEach(() => {
  const db = new Database(":memory:", { strict: true });
  runMigrations(db, [...coreMigrations, ...motorsportMigrations]);
  repo = new MotorsportRepo(db);
});

const followed: Followed = {
  series: "f1",
  channelId: "c1",
  roleId: "r1",
  pinnedMessageId: "m1",
  pinnedEventId: null,
  channelName: null,
  renamedAt: null,
};

function session(sessionId: string, pingable: boolean): Session {
  return {
    series: "f1",
    eventId: "e",
    eventName: "E",
    sessionId,
    title: sessionId,
    start: new Date("2026-03-10T12:00:00Z"),
    end: new Date("2026-03-10T13:00:00Z"),
    pingable,
  };
}

describe("followed", () => {
  test("round-trips", () => {
    repo.insertFollowed(followed);
    expect(repo.getFollowed("f1")).toEqual(followed);
    expect(repo.listFollowed()).toEqual([followed]);
    expect(repo.getFollowed("wec")).toBeNull();
  });

  test("partial update keeps other fields", () => {
    repo.insertFollowed(followed);
    repo.updateFollowed("f1", { channelName: "x", renamedAt: 5 });
    expect(repo.getFollowed("f1")).toEqual({ ...followed, channelName: "x", renamedAt: 5 });
  });
});

describe("sessions", () => {
  test("replace swaps the whole series", () => {
    repo.replaceSessions("f1", [session("a", true), session("b", false)], 1);
    repo.replaceSessions("f1", [session("a", true)], 2);
    expect(repo.listSessions("f1")).toEqual([session("a", true)]);
  });

  test("dates and pingable survive", () => {
    repo.replaceSessions("f1", [session("b", false)], 1);
    const [s] = repo.listSessions("f1");
    expect(s?.start).toEqual(new Date("2026-03-10T12:00:00Z"));
    expect(s?.pingable).toBe(false);
  });
});

describe("one-off reminders", () => {
  test("toggle, list, clear", () => {
    expect(repo.toggleOneOff("u1", "f1", "e", "race")).toBe(true);
    expect(repo.oneOffUsers("f1", "e", "race")).toEqual(["u1"]);
    expect(repo.toggleOneOff("u1", "f1", "e", "race")).toBe(false);
    expect(repo.oneOffUsers("f1", "e", "race")).toEqual([]);
    repo.toggleOneOff("u2", "f1", "e", "race");
    repo.clearOneOff("f1", "e", "race");
    expect(repo.oneOffUsers("f1", "e", "race")).toEqual([]);
  });
});

describe("sent pings", () => {
  const ping = {
    series: "f1" as const,
    eventId: "e",
    sessionId: "s",
    channelId: "c1",
    messageId: "m9",
    deleteAt: 1000,
  };

  test("due deletes and dedupe keys", () => {
    repo.insertSentPing(ping);
    expect(repo.sentKeys("f1").has("e/s")).toBe(true);
    expect(repo.duePingDeletes(999)).toEqual([]);
    expect(repo.duePingDeletes(1000)).toEqual([
      { series: "f1", eventId: "e", sessionId: "s", channelId: "c1", messageId: "m9" },
    ]);
    repo.markPingDeleted("f1", "e", "s");
    expect(repo.duePingDeletes(5000)).toEqual([]);
    expect(repo.sentKeys("f1").has("e/s")).toBe(true);
  });

  test("a handled ping without a message is never due", () => {
    repo.insertSentPing({ ...ping, messageId: null });
    expect(repo.duePingDeletes(5000)).toEqual([]);
    expect(repo.sentKeys("f1").has("e/s")).toBe(true);
  });
});

test("deleteSeries removes only that series", () => {
  repo.insertFollowed(followed);
  repo.insertFollowed({ ...followed, series: "wec" });
  repo.toggleOneOff("u1", "f1", "e", "race");
  repo.deleteSeries("f1");
  expect(repo.getFollowed("f1")).toBeNull();
  expect(repo.getFollowed("wec")).not.toBeNull();
  expect(repo.oneOffUsers("f1", "e", "race")).toEqual([]);
});

test("deleteSeries remembers sent pings so a re-follow doesn't repeat them", () => {
  repo.insertFollowed(followed);
  repo.insertFollowed({ ...followed, series: "wec" });
  repo.toggleOneOff("u1", "f1", "e", "race");
  repo.insertSentPing({
    series: "f1",
    eventId: "e",
    sessionId: "s",
    channelId: "c",
    messageId: "m",
    deleteAt: 1,
  });
  repo.deleteSeries("f1");
  expect(repo.sentKeys("f1")).toEqual(new Set(["e/s"]));
  // The message went with the channel: nothing left for cleanup to delete.
  expect(repo.duePingDeletes(2)).toEqual([]);
});

describe("per-user reminder sets", () => {
  test("setOneOffs replaces the user's set for that event only", () => {
    repo.setOneOffs("u1", "f1", "e", ["q", "race"]);
    repo.setOneOffs("u1", "f1", "other", ["race"]);
    repo.setOneOffs("u2", "f1", "e", ["race"]);
    expect(repo.userOneOffs("u1", "f1", "e")).toEqual(["q", "race"]);
    repo.setOneOffs("u1", "f1", "e", ["race"]);
    expect(repo.userOneOffs("u1", "f1", "e")).toEqual(["race"]);
    repo.setOneOffs("u1", "f1", "e", []);
    expect(repo.userOneOffs("u1", "f1", "e")).toEqual([]);
    expect(repo.userOneOffs("u1", "f1", "other")).toEqual(["race"]);
    expect(repo.oneOffUsers("f1", "e", "race")).toEqual(["u2"]);
  });
});

test("weather replace and lookup by session key", () => {
  const f = { tempC: 20.5, rainChance: 10, code: 1 };
  repo.replaceWeather("f1", [{ eventId: "e", sessionId: "race", forecast: f }], 1);
  repo.replaceWeather("f1", [{ eventId: "e", sessionId: "q", forecast: f }], 2);
  const weather = repo.weatherFor("f1");
  expect([...weather.keys()]).toEqual(["e/q"]);
  expect(weather.get("e/q")).toEqual(f);
  expect(repo.weatherFor("wec").size).toBe(0);
});

const stored = (sessionId: string, postedAt: number): StoredResult => ({
  series: "f1",
  eventId: "e",
  eventName: "E",
  sessionId,
  kind: sessionId === "race" ? "race" : "qualifying",
  rows: [{ pos: "1", id: "1", name: "Norris", team: "McLaren", time: "1:30.000" }],
  postedAt,
});

describe("results", () => {
  test("stores results, lists their keys, returns the latest", () => {
    expect(repo.latestResult("f1")).toBeNull();
    repo.insertResult(stored("qualifying", 1));
    repo.insertResult(stored("race", 2));
    expect(repo.resultKeys("f1")).toEqual(new Set(["e/qualifying", "e/race"]));
    expect(repo.resultKeys("motogp")).toEqual(new Set());
    expect(repo.latestResult("f1")).toEqual(stored("race", 2));
  });

  test("inserting the same session twice keeps one row", () => {
    repo.insertResult(stored("race", 1));
    repo.insertResult(stored("race", 2));
    expect(repo.resultKeys("f1").size).toBe(1);
  });
});

describe("predictions", () => {
  test("picks round-trip per user and session; nothing picked is all null", () => {
    expect(repo.getPicks("u1", "f1", "e", "race")).toEqual([null, null, null]);
    repo.setPicks("u1", "f1", "e", "race", ["1", null, "3"], 1);
    repo.setPicks("u1", "f1", "e", "race", ["1", "2", "3"], 2);
    repo.setPicks("u2", "f1", "e", "sprint", ["4", null, null], 2);
    expect(repo.getPicks("u1", "f1", "e", "race")).toEqual(["1", "2", "3"]);
    expect(repo.getPicks("u2", "f1", "e", "race")).toEqual([null, null, null]);
  });

  test("only complete predictions count and get scored", () => {
    repo.setPicks("u1", "f1", "e", "race", ["1", "2", "3"], 1);
    repo.setPicks("u2", "f1", "e", "race", ["1", null, "3"], 1);
    repo.setPicks("u3", "f1", "e", "sprint", ["1", "2", "3"], 1);
    repo.setPicks("u4", "f1", "other", "race", ["1", "2", "3"], 1);
    expect(repo.completePredictions("f1", "e", "race")).toEqual([
      { userId: "u1", picks: ["1", "2", "3"] },
    ]);
    expect(repo.predictionCounts("f1", "e")).toEqual(
      new Map([
        ["race", 1],
        ["sprint", 1],
      ]),
    );
  });

  test("season entries: complete race/sprint predictions with results posted since", () => {
    repo.setPicks("u1", "f1", "e", "race", ["1", "2", "3"], 1);
    repo.setPicks("u1", "f1", "e", "qualifying", ["1", "2", "3"], 1);
    repo.setPicks("u2", "f1", "old", "race", ["1", "2", "3"], 1);
    repo.setPicks("u3", "f1", "e", "race", ["1", null, null], 1);
    repo.insertResult(stored("race", 100));
    repo.insertResult(stored("qualifying", 100));
    repo.insertResult({ ...stored("race", 5), eventId: "old" });
    expect(repo.seasonPredictions("f1", 50)).toEqual([
      { userId: "u1", picks: ["1", "2", "3"], rows: stored("race", 100).rows },
    ]);
  });
});
