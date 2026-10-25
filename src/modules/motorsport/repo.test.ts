import { Database } from "bun:sqlite";
import { beforeEach, describe, expect, test } from "bun:test";
import { runMigrations } from "../../core/db.ts";
import { coreMigrations } from "../../core/settings.ts";
import { MotorsportRepo } from "./repo.ts";
import { motorsportMigrations } from "./store/migrations.ts";
import type { Followed, StoredResult } from "./types.ts";
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
    repo.followed.insert(followed);
    expect(repo.followed.get("f1")).toEqual(followed);
    expect(repo.followed.list()).toEqual([followed]);
    expect(repo.followed.get("wec")).toBeNull();
  });

  test("partial update keeps other fields", () => {
    repo.followed.insert(followed);
    repo.followed.update("f1", { channelName: "x", renamedAt: 5 });
    expect(repo.followed.get("f1")).toEqual({ ...followed, channelName: "x", renamedAt: 5 });
  });
});

describe("sessions", () => {
  test("replace swaps the whole series", () => {
    repo.sessions.replace("f1", [session("a", true), session("b", false)], 1);
    repo.sessions.replace("f1", [session("a", true)], 2);
    expect(repo.sessions.list("f1")).toEqual([session("a", true)]);
  });

  test("dates and pingable survive", () => {
    repo.sessions.replace("f1", [session("b", false)], 1);
    const [s] = repo.sessions.list("f1");
    expect(s?.start).toEqual(new Date("2026-03-10T12:00:00Z"));
    expect(s?.pingable).toBe(false);
  });
});

describe("one-off reminders", () => {
  test("toggle, list, clear", () => {
    expect(repo.reminders.toggle("u1", "f1", "e", "race")).toBe(true);
    expect(repo.reminders.users("f1", "e", "race")).toEqual(["u1"]);
    expect(repo.reminders.toggle("u1", "f1", "e", "race")).toBe(false);
    expect(repo.reminders.users("f1", "e", "race")).toEqual([]);
    repo.reminders.toggle("u2", "f1", "e", "race");
    repo.reminders.clear("f1", "e", "race");
    expect(repo.reminders.users("f1", "e", "race")).toEqual([]);
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
    repo.pings.insert(ping);
    expect(repo.pings.sentKeys("f1").has("e/s")).toBe(true);
    expect(repo.pings.dueDeletes(999)).toEqual([]);
    expect(repo.pings.dueDeletes(1000)).toEqual([
      { series: "f1", eventId: "e", sessionId: "s", channelId: "c1", messageId: "m9" },
    ]);
    repo.pings.markDeleted("f1", "e", "s");
    expect(repo.pings.dueDeletes(5000)).toEqual([]);
    expect(repo.pings.sentKeys("f1").has("e/s")).toBe(true);
  });

  test("a handled ping without a message is never due", () => {
    repo.pings.insert({ ...ping, messageId: null });
    expect(repo.pings.dueDeletes(5000)).toEqual([]);
    expect(repo.pings.sentKeys("f1").has("e/s")).toBe(true);
  });
});

test("deleteSeries removes only that series", () => {
  repo.followed.insert(followed);
  repo.followed.insert({ ...followed, series: "wec" });
  repo.reminders.toggle("u1", "f1", "e", "race");
  repo.deleteSeries("f1");
  expect(repo.followed.get("f1")).toBeNull();
  expect(repo.followed.get("wec")).not.toBeNull();
  expect(repo.reminders.users("f1", "e", "race")).toEqual([]);
});

test("deleteSeries remembers sent pings so a re-follow doesn't repeat them", () => {
  repo.followed.insert(followed);
  repo.followed.insert({ ...followed, series: "wec" });
  repo.reminders.toggle("u1", "f1", "e", "race");
  repo.pings.insert({
    series: "f1",
    eventId: "e",
    sessionId: "s",
    channelId: "c",
    messageId: "m",
    deleteAt: 1,
  });
  repo.deleteSeries("f1");
  expect(repo.pings.sentKeys("f1")).toEqual(new Set(["e/s"]));
  // The message went with the channel: nothing left for cleanup to delete.
  expect(repo.pings.dueDeletes(2)).toEqual([]);
});

describe("per-user reminder sets", () => {
  test("setOneOffs replaces the user's set for that event only", () => {
    repo.reminders.set("u1", "f1", "e", ["q", "race"]);
    repo.reminders.set("u1", "f1", "other", ["race"]);
    repo.reminders.set("u2", "f1", "e", ["race"]);
    expect(repo.reminders.ofUser("u1", "f1", "e")).toEqual(["q", "race"]);
    repo.reminders.set("u1", "f1", "e", ["race"]);
    expect(repo.reminders.ofUser("u1", "f1", "e")).toEqual(["race"]);
    repo.reminders.set("u1", "f1", "e", []);
    expect(repo.reminders.ofUser("u1", "f1", "e")).toEqual([]);
    expect(repo.reminders.ofUser("u1", "f1", "other")).toEqual(["race"]);
    expect(repo.reminders.users("f1", "e", "race")).toEqual(["u2"]);
  });
});

test("weather replace and lookup by session key", () => {
  const f = { tempC: 20.5, rainChance: 10, code: 1 };
  repo.weather.replace("f1", [{ eventId: "e", sessionId: "race", forecast: f }], 1);
  repo.weather.replace("f1", [{ eventId: "e", sessionId: "q", forecast: f }], 2);
  const weather = repo.weather.bySession("f1");
  expect([...weather.keys()]).toEqual(["e/q"]);
  expect(weather.get("e/q")).toEqual(f);
  expect(repo.weather.bySession("wec").size).toBe(0);
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
    expect(repo.results.latest("f1")).toBeNull();
    repo.results.insert(stored("qualifying", 1));
    repo.results.insert(stored("race", 2));
    expect(repo.results.keys("f1")).toEqual(new Set(["e/qualifying", "e/race"]));
    expect(repo.results.keys("motogp")).toEqual(new Set());
    expect(repo.results.latest("f1")).toEqual(stored("race", 2));
  });

  test("inserting the same session twice keeps one row", () => {
    repo.results.insert(stored("race", 1));
    repo.results.insert(stored("race", 2));
    expect(repo.results.keys("f1").size).toBe(1);
  });
});

describe("predictions", () => {
  test("picks round-trip per user and session; nothing picked is all null", () => {
    expect(repo.predictions.get("u1", "f1", "e", "race")).toEqual([null, null, null]);
    repo.predictions.set(
      { userId: "u1", now: 1 },
      { series: "f1", eventId: "e", sessionId: "race" },
      ["1", null, "3"],
    );
    repo.predictions.set(
      { userId: "u1", now: 2 },
      { series: "f1", eventId: "e", sessionId: "race" },
      ["1", "2", "3"],
    );
    repo.predictions.set(
      { userId: "u2", now: 2 },
      { series: "f1", eventId: "e", sessionId: "sprint" },
      ["4", null, null],
    );
    expect(repo.predictions.get("u1", "f1", "e", "race")).toEqual(["1", "2", "3"]);
    expect(repo.predictions.get("u2", "f1", "e", "race")).toEqual([null, null, null]);
  });

  test("only complete predictions count and get scored", () => {
    repo.predictions.set(
      { userId: "u1", now: 1 },
      { series: "f1", eventId: "e", sessionId: "race" },
      ["1", "2", "3"],
    );
    repo.predictions.set(
      { userId: "u2", now: 1 },
      { series: "f1", eventId: "e", sessionId: "race" },
      ["1", null, "3"],
    );
    repo.predictions.set(
      { userId: "u3", now: 1 },
      { series: "f1", eventId: "e", sessionId: "sprint" },
      ["1", "2", "3"],
    );
    repo.predictions.set(
      { userId: "u4", now: 1 },
      { series: "f1", eventId: "other", sessionId: "race" },
      ["1", "2", "3"],
    );
    expect(repo.predictions.complete("f1", "e", "race")).toEqual([
      { userId: "u1", picks: ["1", "2", "3"] },
    ]);
    expect(repo.predictions.counts("f1", "e")).toEqual(
      new Map([
        ["race", 1],
        ["sprint", 1],
      ]),
    );
  });

  test("season entries: complete race/sprint predictions with results posted since", () => {
    repo.predictions.set(
      { userId: "u1", now: 1 },
      { series: "f1", eventId: "e", sessionId: "race" },
      ["1", "2", "3"],
    );
    repo.predictions.set(
      { userId: "u1", now: 1 },
      { series: "f1", eventId: "e", sessionId: "qualifying" },
      ["1", "2", "3"],
    );
    repo.predictions.set(
      { userId: "u2", now: 1 },
      { series: "f1", eventId: "old", sessionId: "race" },
      ["1", "2", "3"],
    );
    repo.predictions.set(
      { userId: "u3", now: 1 },
      { series: "f1", eventId: "e", sessionId: "race" },
      ["1", null, null],
    );
    repo.results.insert(stored("race", 100));
    repo.results.insert(stored("qualifying", 100));
    repo.results.insert({ ...stored("race", 5), eventId: "old" });
    expect(repo.predictions.season("f1", 50)).toEqual([
      { userId: "u1", picks: ["1", "2", "3"], rows: stored("race", 100).rows },
    ]);
  });
});

test("one thread per series weekend", () => {
  expect(repo.threads.get("f1", "e")).toBeNull();
  repo.threads.set("f1", "e", "t1");
  repo.threads.set("f1", "e", "t2");
  repo.threads.set("motogp", "e", "t3");
  expect(repo.threads.get("f1", "e")).toBe("t2");
  expect(repo.threads.get("motogp", "e")).toBe("t3");
});

test("handled rulings are remembered per series, posted or not", () => {
  repo.rulings.mark("f1", { eventId: "e", url: "https://fia/a.pdf", posted: true, now: 1 });
  repo.rulings.mark("f1", { eventId: "e", url: "https://fia/b.pdf", posted: false, now: 1 });
  repo.rulings.mark("f1", { eventId: "e", url: "https://fia/b.pdf", posted: false, now: 2 });
  expect(repo.rulings.handled("f1")).toEqual(new Set(["https://fia/a.pdf", "https://fia/b.pdf"]));
  expect(repo.rulings.handled("motogp")).toEqual(new Set());
});
