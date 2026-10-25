import { Database } from "bun:sqlite";
import { beforeEach, describe, expect, test } from "bun:test";
import { runMigrations } from "../../../../src/core/db.ts";
import { coreMigrations } from "../../../../src/core/settings.ts";
import { setReminders, toggleReminder } from "../../../../src/modules/motorsport/pings/actions.ts";
import { MotorsportRepo } from "../../../../src/modules/motorsport/repo.ts";
import { motorsportMigrations } from "../../../../src/modules/motorsport/store/migrations.ts";
import type { Session } from "../../../../src/modules/motorsport/types.ts";

const T = Date.parse("2026-03-14T07:00:00Z");
let repo: MotorsportRepo;

function session(sessionId: string, title: string, pingable: boolean, start: number): Session {
  return {
    series: "f1",
    eventId: "chinese-grand-prix",
    eventName: "Chinese Grand Prix",
    sessionId,
    title,
    start: new Date(start),
    end: new Date(start + 3_600_000),
    pingable,
  };
}

beforeEach(() => {
  const db = new Database(":memory:", { strict: true });
  runMigrations(db, [...coreMigrations, ...motorsportMigrations]);
  repo = new MotorsportRepo(db);
  repo.sessions.replace(
    "f1",
    [
      session("practice-1", "Practice 1", false, T + 3_600_000),
      session("qualifying", "Qualifying", true, T + 7_200_000),
      session("sprint-race", "Sprint Race", true, T - 3_600_000),
    ],
    T,
  );
});

function follow(): void {
  repo.followed.insert({
    series: "f1",
    channelId: "c",
    roleId: "r",
    pinnedMessageId: "m",
    pinnedEventId: null,
    channelName: null,
    renamedAt: null,
  });
}

describe("toggleReminder", () => {
  test("requires the series to be followed", () => {
    expect(
      toggleReminder(
        repo,
        { userId: "u", now: T },
        { series: "f1", eventId: "chinese-grand-prix", sessionId: "qualifying" },
      ),
    ).toBe("F1 isn't followed. Use /motorsport follow first.");
  });

  test("sets then removes a reminder", () => {
    follow();
    expect(
      toggleReminder(
        repo,
        { userId: "u", now: T },
        { series: "f1", eventId: "chinese-grand-prix", sessionId: "qualifying" },
      ),
    ).toBe("Reminder set for Chinese Grand Prix Qualifying.");
    expect(repo.reminders.users("f1", "chinese-grand-prix", "qualifying")).toEqual(["u"]);
    expect(
      toggleReminder(
        repo,
        { userId: "u", now: T },
        { series: "f1", eventId: "chinese-grand-prix", sessionId: "qualifying" },
      ),
    ).toBe("Reminder removed for Chinese Grand Prix Qualifying.");
  });

  test("rejects practice, past sessions and other events", () => {
    follow();
    const rejected = "That session isn't in the next F1 event.";
    expect(
      toggleReminder(
        repo,
        { userId: "u", now: T },
        { series: "f1", eventId: "chinese-grand-prix", sessionId: "practice-1" },
      ),
    ).toBe(rejected);
    expect(
      toggleReminder(
        repo,
        { userId: "u", now: T },
        { series: "f1", eventId: "chinese-grand-prix", sessionId: "sprint-race" },
      ),
    ).toBe(rejected);
    expect(
      toggleReminder(
        repo,
        { userId: "u", now: T },
        { series: "f1", eventId: "other", sessionId: "qualifying" },
      ),
    ).toBe(rejected);
  });

  test("rejects a session whose ping already went out", () => {
    follow();
    pinged("qualifying");
    expect(
      toggleReminder(
        repo,
        { userId: "u", now: T },
        { series: "f1", eventId: "chinese-grand-prix", sessionId: "qualifying" },
      ),
    ).toBe("Chinese Grand Prix Qualifying has already been pinged.");
    expect(repo.reminders.users("f1", "chinese-grand-prix", "qualifying")).toEqual([]);
  });
});

function pinged(sessionId: string): void {
  repo.pings.insert({
    series: "f1",
    eventId: "chinese-grand-prix",
    sessionId,
    channelId: "c",
    messageId: "p",
    deleteAt: T + 86_400_000,
  });
}

describe("setReminders", () => {
  test("keeps only upcoming pinged sessions and describes the result", () => {
    follow();
    const text = setReminders(
      repo,
      { userId: "u", now: T },
      { series: "f1", eventId: "chinese-grand-prix" },
      ["qualifying", "practice-1", "sprint-race"],
    );
    expect(text).toBe("Reminders for Chinese Grand Prix: Qualifying.");
    expect(repo.reminders.ofUser("u", "f1", "chinese-grand-prix")).toEqual(["qualifying"]);
  });

  test("skips sessions already pinged", () => {
    follow();
    pinged("qualifying");
    expect(
      setReminders(repo, { userId: "u", now: T }, { series: "f1", eventId: "chinese-grand-prix" }, [
        "qualifying",
      ]),
    ).toBe("No reminders for Chinese Grand Prix.");
    expect(repo.reminders.ofUser("u", "f1", "chinese-grand-prix")).toEqual([]);
  });

  test("an empty selection clears them", () => {
    follow();
    setReminders(repo, { userId: "u", now: T }, { series: "f1", eventId: "chinese-grand-prix" }, [
      "qualifying",
    ]);
    expect(
      setReminders(
        repo,
        { userId: "u", now: T },
        { series: "f1", eventId: "chinese-grand-prix" },
        [],
      ),
    ).toBe("No reminders for Chinese Grand Prix.");
    expect(repo.reminders.ofUser("u", "f1", "chinese-grand-prix")).toEqual([]);
  });
});
